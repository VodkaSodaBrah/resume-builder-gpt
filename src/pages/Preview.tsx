import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileText,
  FileCheck,
  Palette,
  RefreshCw,
  AlertCircle,
  User,
  Briefcase,
  GraduationCap,
  Heart,
  Wrench,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useConversationStore } from '@/stores/conversationStore';
import { useAnalyticsStore, AnalyticsEvents } from '@/stores/analyticsStore';
import { downloadPDF, downloadDOCX, expandDegreeAbbreviation } from '@/lib/resumeGenerator';
import { getResume, supabase } from '@/lib/supabase';
import type { ResumeData, TemplateStyle } from '@/types';

// AI Enhancement helper - calls the Azure Functions API
async function enhanceWithAI(
  workExperiences: Array<{ jobTitle: string; responsibilities: string }>,
  language: string = 'en'
): Promise<Array<{ enhanced: string }> | null> {
  try {
    const response = await fetch('/api/resume/enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'all_experiences',
        data: { workExperiences },
        language,
      }),
    });

    const data = await response.json();

    if (data?.success && data?.result) {
      return data.result;
    }

    return null;
  } catch (error) {
    console.error('Enhancement failed:', error);
    return null;
  }
}

export const Preview: React.FC = () => {
  const { resumeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoaded } = useAuth();
  const { trackEvent } = useAnalyticsStore();

  // Get conversation store data as fallback
  const conversationResumeData = useConversationStore((state) => state.resumeData);

  // Try multiple data sources: location.state > conversationStore
  // Cast conversationResumeData to ResumeData since it may be Partial but should have enough data to display
  const initialData = location.state?.resumeData ||
    (conversationResumeData && Object.keys(conversationResumeData).length > 0 ? conversationResumeData as ResumeData : null);

  const [resumeData, setResumeData] = useState<ResumeData | null>(initialData);
  const [isLoading, setIsLoading] = useState(!initialData && !!resumeId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateStyle>(
    initialData?.templateStyle || 'modern'
  );
  const [showEditModal, setShowEditModal] = useState(false);

  // Section options for the Edit modal
  const editSections = [
    { id: 'personal', label: 'Personal Information', icon: User, description: 'Name, email, phone, location' },
    { id: 'work', label: 'Work Experience', icon: Briefcase, description: 'Jobs, responsibilities, dates' },
    { id: 'education', label: 'Education', icon: GraduationCap, description: 'Schools, degrees, fields of study' },
    { id: 'volunteering', label: 'Volunteering', icon: Heart, description: 'Volunteer work and community service' },
    { id: 'skills', label: 'Skills', icon: Wrench, description: 'Technical skills, certifications, languages' },
    { id: 'references', label: 'References', icon: Users, description: 'Professional references' },
  ];

  const handleEditSection = (sectionId: string) => {
    setShowEditModal(false);
    // Navigate to builder with section parameter
    const builderPath = resumeId && resumeId !== 'new'
      ? `/builder/${resumeId}?editSection=${sectionId}`
      : `/builder?editSection=${sectionId}`;
    navigate(builderPath);
  };

  // Load resume from Supabase if resumeId provided and no initial data
  useEffect(() => {
    if (resumeId && !resumeData && isLoaded && user) {
      loadResume();
    } else if (!resumeId && !resumeData && conversationResumeData && Object.keys(conversationResumeData).length > 0) {
      // Fallback: use conversation store data if no resumeId
      setResumeData(conversationResumeData as ResumeData);
      setIsLoading(false);
    }
  }, [resumeId, resumeData, isLoaded, user, conversationResumeData]);

  const loadResume = async () => {
    if (!user || !resumeId) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      const resume = await getResume(resumeId, user.id);
      if (resume) {
        setResumeData(resume.resume_data);
        setSelectedTemplate(resume.resume_data.templateStyle || 'modern');
      } else {
        // Database returned no data - try conversation store as fallback
        if (conversationResumeData && Object.keys(conversationResumeData).length > 0) {
          console.log('Using conversation store data as fallback');
          setResumeData(conversationResumeData as ResumeData);
        } else {
          setLoadError('Resume not found. It may have been deleted or you may not have permission to view it.');
        }
      }
    } catch (error) {
      console.error('Failed to load resume:', error);
      // Try conversation store as fallback on error
      if (conversationResumeData && Object.keys(conversationResumeData).length > 0) {
        console.log('Database error - using conversation store data as fallback');
        setResumeData(conversationResumeData as ResumeData);
      } else {
        setLoadError('Failed to load resume. Please try again or create a new one.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Enhance resume content with AI (placeholder - will use Supabase Edge Functions later)
  useEffect(() => {
    if (resumeData && !resumeData.workExperience?.[0]?.enhancedResponsibilities && user) {
      enhanceContent();
    }
  }, [resumeData, user]);

  const enhanceContent = async () => {
    if (!resumeData || !user) return;

    // Skip if no work experience to enhance
    if (!resumeData.workExperience || resumeData.workExperience.length === 0) {
      return;
    }

    setIsEnhancing(true);
    trackEvent(AnalyticsEvents.AI_ENHANCEMENT_START);

    try {
      const workExperiences = resumeData.workExperience.map((exp) => ({
        jobTitle: exp.jobTitle,
        responsibilities: exp.responsibilities,
      }));

      const enhanced = await enhanceWithAI(workExperiences, resumeData.language || 'en');

      if (enhanced && enhanced.length > 0) {
        const enhancedData = { ...resumeData };
        enhancedData.workExperience = resumeData.workExperience.map((exp, index) => ({
          ...exp,
          enhancedResponsibilities: enhanced[index]?.enhanced || exp.responsibilities,
        }));
        setResumeData(enhancedData);
      }

      trackEvent(AnalyticsEvents.AI_ENHANCEMENT_COMPLETE);
    } catch (error) {
      console.error('Enhancement failed:', error);
      trackEvent(AnalyticsEvents.AI_ENHANCEMENT_ERROR, { error: String(error) });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!resumeData) return;

    setIsDownloading(true);
    trackEvent(AnalyticsEvents.DOWNLOAD_PDF);

    try {
      const dataWithTemplate = { ...resumeData, templateStyle: selectedTemplate };
      await downloadPDF(dataWithTemplate);
    } catch (error) {
      console.error('PDF download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadDOCX = async () => {
    if (!resumeData) return;

    setIsDownloading(true);
    trackEvent(AnalyticsEvents.DOWNLOAD_DOCX);

    try {
      const dataWithTemplate = { ...resumeData, templateStyle: selectedTemplate };
      await downloadDOCX(dataWithTemplate);
    } catch (error) {
      console.error('DOCX download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTemplateChange = (template: TemplateStyle) => {
    setSelectedTemplate(template);
    trackEvent(AnalyticsEvents.TEMPLATE_SELECTED, { template });
  };

  if (isLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          {loadError ? (
            <>
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-white mb-2">Unable to Load Resume</h2>
              <p className="text-[#a1a1aa] mb-6">{loadError}</p>
            </>
          ) : (
            <>
              <FileText className="w-12 h-12 text-[#27272a] mx-auto mb-4" />
              <h2 className="text-lg font-medium text-white mb-2">No Resume Data</h2>
              <p className="text-[#a1a1aa] mb-6">
                Please complete the resume builder first.
              </p>
            </>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="primary" onClick={() => navigate('/builder')}>
              {loadError ? 'Create New Resume' : 'Start Building'}
            </Button>
            {loadError && (
              <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const templates: { id: TemplateStyle; name: string; description: string }[] = [
    {
      id: 'classic',
      name: 'Classic',
      description: 'Traditional style with Times New Roman',
    },
    {
      id: 'modern',
      name: 'Modern',
      description: 'Clean design with Arial font',
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Compact layout with Calibri',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#27272a] bg-[#111111]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-green-500 font-mono text-sm">&lt;</span>
              <span className="text-white text-sm font-medium">
                Preview & Download
              </span>
              <span className="text-green-500 font-mono text-sm">/&gt;</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Options */}
          <div className="space-y-6">
            {/* AI Enhancement Status */}
            {isEnhancing && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      Enhancing your resume...
                    </p>
                    <p className="text-xs text-[#a1a1aa]">
                      Making your experience sound more professional
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Template Selection */}
            <div className="bg-[#111111] border border-[#27272a] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-[#a1a1aa]" />
                <h2 className="text-lg font-semibold text-white">
                  Choose Template
                </h2>
              </div>

              <div className="space-y-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateChange(template.id)}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      selectedTemplate === template.id
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-[#27272a] hover:border-[#3f3f46] bg-[#0a0a0a]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">
                        {template.name}
                      </span>
                      {selectedTemplate === template.id && (
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-[#71717a] mt-1">
                      {template.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Download Options */}
            <div className="bg-[#111111] border border-[#27272a] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Download className="w-5 h-5 text-[#a1a1aa]" />
                <h2 className="text-lg font-semibold text-white">
                  Download Resume
                </h2>
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleDownloadPDF}
                  isLoading={isDownloading}
                  disabled={isEnhancing}
                >
                  <FileText className="w-4 h-4" />
                  Download PDF
                </Button>

                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleDownloadDOCX}
                  isLoading={isDownloading}
                  disabled={isEnhancing}
                >
                  <FileCheck className="w-4 h-4" />
                  Download Word (DOCX)
                </Button>
              </div>

              <p className="text-xs text-[#71717a] mt-4 text-center">
                Both formats are ATS-friendly and optimized for job applications
              </p>
            </div>

            {/* Edit Option */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowEditModal(true)}
            >
              Edit Resume
            </Button>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              {/* Preview Header */}
              <div className="bg-[#1a1a1a] px-6 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-4 text-sm text-[#a1a1aa] font-mono">
                  resume_preview.pdf
                </span>
              </div>

              {/* Resume Preview Content */}
              <div className="p-8 min-h-[800px] text-black">
                {/* Name */}
                <h1
                  className={`text-center mb-2 ${
                    selectedTemplate === 'classic'
                      ? 'text-2xl font-serif'
                      : selectedTemplate === 'modern'
                      ? 'text-2xl font-sans'
                      : 'text-xl font-sans'
                  }`}
                  style={{ fontWeight: 'bold' }}
                >
                  {resumeData.personalInfo?.fullName}
                </h1>

                {/* Contact */}
                <p className="text-center text-sm text-gray-600 mb-6">
                  {[
                    resumeData.personalInfo?.email,
                    resumeData.personalInfo?.phone,
                    resumeData.personalInfo?.city,
                  ]
                    .filter(Boolean)
                    .join(' | ')}
                </p>

                {/* Work Experience */}
                {resumeData.workExperience &&
                  resumeData.workExperience.length > 0 && (
                    <div className="mb-6">
                      <h2
                        className={`text-sm uppercase tracking-wider font-bold mb-2 pb-1 border-b ${
                          selectedTemplate === 'modern'
                            ? 'text-blue-600 border-blue-600'
                            : selectedTemplate === 'professional'
                            ? 'text-green-600 border-green-600'
                            : 'text-black border-black'
                        }`}
                      >
                        Work Experience
                      </h2>
                      {resumeData.workExperience.map((job, index) => (
                        <div key={index} className="mb-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold">
                                {job.jobTitle} | {job.companyName}
                              </p>
                              <p className="text-sm text-gray-600 italic">
                                {job.startDate} -{' '}
                                {job.isCurrentJob ? 'Present' : job.endDate} |{' '}
                                {job.location}
                              </p>
                            </div>
                          </div>
                          <ul className="mt-2 ml-4 text-sm">
                            {(
                              job.enhancedResponsibilities || job.responsibilities
                            )
                              .split('\n')
                              .filter((line) => line.trim())
                              .map((point, i) => (
                                <li key={i} className="mb-1">
                                  {point.replace(/^[-•*]\s*/, '').trim()
                                    ? `- ${point.replace(/^[-•*]\s*/, '').trim()}`
                                    : null}
                                </li>
                              ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                {/* Education */}
                {resumeData.education && resumeData.education.length > 0 && (
                  <div className="mb-6">
                    <h2
                      className={`text-sm uppercase tracking-wider font-bold mb-2 pb-1 border-b ${
                        selectedTemplate === 'modern'
                          ? 'text-blue-600 border-blue-600'
                          : selectedTemplate === 'professional'
                          ? 'text-green-600 border-green-600'
                          : 'text-black border-black'
                      }`}
                    >
                      Education
                    </h2>
                    {resumeData.education.map((edu, index) => (
                      <div key={index} className="mb-2">
                        <p className="font-bold">
                          {expandDegreeAbbreviation(edu.degree)}
                          {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                        </p>
                        <p className="text-sm text-gray-600 italic">
                          {edu.schoolName} | {edu.startYear} -{' '}
                          {edu.isCurrentlyStudying ? 'Present' : edu.endYear}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Volunteering */}
                {resumeData.volunteering && resumeData.volunteering.length > 0 && (
                  <div className="mb-6">
                    <h2
                      className={`text-sm uppercase tracking-wider font-bold mb-2 pb-1 border-b ${
                        selectedTemplate === 'modern'
                          ? 'text-blue-600 border-blue-600'
                          : selectedTemplate === 'professional'
                          ? 'text-green-600 border-green-600'
                          : 'text-black border-black'
                      }`}
                    >
                      Volunteer Experience
                    </h2>
                    {resumeData.volunteering.map((vol, index) => (
                      <div key={index} className="mb-3">
                        <div className="flex justify-between items-start">
                          <p className="font-bold">{vol.role}</p>
                          <span className="text-sm text-gray-600 italic">
                            {vol.startDate}{vol.endDate ? ` - ${vol.endDate}` : ' - Present'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{vol.organizationName}</p>
                        {vol.responsibilities && (
                          <p className="mt-1 text-sm text-gray-600">{vol.responsibilities}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Skills */}
                {resumeData.skills && (
                  resumeData.skills.technicalSkills?.length > 0 ||
                  resumeData.skills.softSkills?.length > 0 ||
                  resumeData.skills.certifications?.length > 0 ||
                  resumeData.skills.languages?.length > 0
                ) && (
                  <div className="mb-6">
                    <h2
                      className={`text-sm uppercase tracking-wider font-bold mb-2 pb-1 border-b ${
                        selectedTemplate === 'modern'
                          ? 'text-blue-600 border-blue-600'
                          : selectedTemplate === 'professional'
                          ? 'text-green-600 border-green-600'
                          : 'text-black border-black'
                      }`}
                    >
                      Skills
                    </h2>
                    <ul className="text-sm ml-4">
                      {resumeData.skills.technicalSkills?.length > 0 && (
                        <li className="mb-1">
                          <strong>Technical:</strong>{' '}
                          {resumeData.skills.technicalSkills.join(', ')}
                        </li>
                      )}
                      {resumeData.skills.softSkills?.length > 0 && (
                        <li className="mb-1">
                          <strong>Soft Skills:</strong>{' '}
                          {resumeData.skills.softSkills.join(', ')}
                        </li>
                      )}
                      {resumeData.skills.certifications?.length > 0 && (
                        <li className="mb-1">
                          <strong>Certifications:</strong>{' '}
                          {resumeData.skills.certifications.join(', ')}
                        </li>
                      )}
                      {resumeData.skills.languages?.length > 0 && (
                        <li className="mb-1">
                          <strong>Languages:</strong>{' '}
                          {resumeData.skills.languages
                            .map((l) => `${l.language} (${l.proficiency})`)
                            .join(', ')}
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* References */}
                {resumeData.references && resumeData.references.length > 0 && (
                  <div className="mb-6">
                    <h2
                      className={`text-sm uppercase tracking-wider font-bold mb-2 pb-1 border-b ${
                        selectedTemplate === 'modern'
                          ? 'text-blue-600 border-blue-600'
                          : selectedTemplate === 'professional'
                          ? 'text-green-600 border-green-600'
                          : 'text-black border-black'
                      }`}
                    >
                      References
                    </h2>
                    {resumeData.references.map((ref, index) => (
                      <div key={index} className="mb-3">
                        <p className="font-bold">{ref.name}</p>
                        {ref.relationship && (
                          <p className="text-sm text-gray-600 italic">{ref.relationship}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          {[ref.email, ref.phone].filter(Boolean).join(' | ')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Section Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-[#1a1a1a] border border-[#27272a] rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Edit Resume</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-[#27272a] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#71717a]" />
              </button>
            </div>

            {/* Section Options */}
            <p className="text-[#a1a1aa] text-sm mb-4">
              Which section would you like to edit?
            </p>

            <div className="space-y-2">
              {editSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleEditSection(section.id)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{section.label}</p>
                    <p className="text-[#71717a] text-sm">{section.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setShowEditModal(false)}
              className="w-full mt-4 py-2 text-[#a1a1aa] hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
