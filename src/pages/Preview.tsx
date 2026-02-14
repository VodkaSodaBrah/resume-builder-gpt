import React, { useState, useEffect, useRef } from 'react';
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
import { EditableField } from '@/components/preview/EditableField';
import { AIRewriteButton } from '@/components/preview/AIRewriteButton';
import { usePreviewEditor } from '@/hooks/usePreviewEditor';
import type { ResumeData, TemplateStyle } from '@/types';

// AI Enhancement helper - calls the API endpoint
export async function enhanceWithAI(
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

    if (!response.ok) {
      console.error('Enhancement API returned', response.status);
      return null;
    }

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

// Empty default for unconditional hook call
const EMPTY_RESUME: ResumeData = {
  personalInfo: { fullName: '', email: '', phone: '' },
  workExperience: [],
  education: [],
  volunteering: [],
  skills: { technicalSkills: [], softSkills: [], certifications: [], languages: [] },
  references: [],
  templateStyle: 'modern',
  language: 'en',
};

export const Preview: React.FC = () => {
  const { resumeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoaded } = useAuth();
  const { trackEvent } = useAnalyticsStore();

  // Get conversation store data as fallback
  const conversationResumeData = useConversationStore((state) => state.resumeData);

  // Try multiple data sources: location.state > conversationStore
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
  const enhancementAttempted = useRef(false);

  // Inline editing hook (called unconditionally per rules of hooks)
  const editor = usePreviewEditor(resumeData || EMPTY_RESUME);
  // Use the editor's data for rendering when we have real data
  const displayData = resumeData ? editor.resumeData : null;
  const { onFieldSave } = editor;

  // Bullet save helper: reconstructs newline-delimited string from individual bullet edits
  const onBulletSave = (jobIndex: number, bulletIndex: number, newValue: string) => {
    if (!displayData) return;
    const job = displayData.workExperience[jobIndex];
    const source = job.enhancedResponsibilities || job.responsibilities;
    const lines = source.split('\n').filter((l) => l.trim());
    lines[bulletIndex] = newValue;
    const path = job.enhancedResponsibilities
      ? `workExperience[${jobIndex}].enhancedResponsibilities`
      : `workExperience[${jobIndex}].responsibilities`;
    onFieldSave(path, lines.join('\n'));
  };

  // Volunteer bullet save helper
  const onVolunteerBulletSave = (volIndex: number, newValue: string) => {
    onFieldSave(`volunteering[${volIndex}].responsibilities`, newValue);
  };

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
        if (conversationResumeData && Object.keys(conversationResumeData).length > 0) {
          console.log('Using conversation store data as fallback');
          setResumeData(conversationResumeData as ResumeData);
        } else {
          setLoadError('Resume not found. It may have been deleted or you may not have permission to view it.');
        }
      }
    } catch (error) {
      console.error('Failed to load resume:', error);
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

  // Enhance resume content with AI (single attempt -- ref prevents retry loops)
  useEffect(() => {
    if (
      resumeData &&
      !resumeData.workExperience?.[0]?.enhancedResponsibilities &&
      user &&
      !enhancementAttempted.current
    ) {
      enhancementAttempted.current = true;
      enhanceContent();
    }
  }, [resumeData, user]);

  const enhanceContent = async () => {
    if (!resumeData || !user) return;

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
    // Use editor data (includes inline edits) if available, else fallback
    const dataForDownload = displayData || resumeData;
    if (!dataForDownload) return;

    setIsDownloading(true);
    trackEvent(AnalyticsEvents.DOWNLOAD_PDF);

    try {
      const dataWithTemplate = { ...dataForDownload, templateStyle: selectedTemplate };
      await downloadPDF(dataWithTemplate);
    } catch (error) {
      console.error('PDF download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadDOCX = async () => {
    const dataForDownload = displayData || resumeData;
    if (!dataForDownload) return;

    setIsDownloading(true);
    trackEvent(AnalyticsEvents.DOWNLOAD_DOCX);

    try {
      const dataWithTemplate = { ...dataForDownload, templateStyle: selectedTemplate };
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

  // Section heading style helper
  const sectionHeadingClass = `text-sm uppercase tracking-wider font-bold mb-2 pb-1 border-b ${
    selectedTemplate === 'modern'
      ? 'text-blue-600 border-blue-600'
      : selectedTemplate === 'professional'
      ? 'text-green-600 border-green-600'
      : 'text-black border-black'
  }`;

  if (isLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!displayData) {
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

  const nameClassName = `text-center mb-2 ${
    selectedTemplate === 'classic'
      ? 'text-2xl font-serif'
      : selectedTemplate === 'modern'
      ? 'text-2xl font-sans'
      : 'text-xl font-sans'
  }`;

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
                <EditableField
                  tag="h1"
                  value={displayData.personalInfo?.fullName || ''}
                  className={nameClassName}
                  onSave={(v) => onFieldSave('personalInfo.fullName', v)}
                />

                {/* Contact */}
                <p className="text-center text-sm text-gray-600 mb-6">
                  {displayData.personalInfo?.email && (
                    <EditableField
                      tag="span"
                      value={displayData.personalInfo.email}
                      className="text-sm text-gray-600"
                      onSave={(v) => onFieldSave('personalInfo.email', v)}
                    />
                  )}
                  {displayData.personalInfo?.email && displayData.personalInfo?.phone && ' | '}
                  {displayData.personalInfo?.phone && (
                    <EditableField
                      tag="span"
                      value={displayData.personalInfo.phone}
                      className="text-sm text-gray-600"
                      onSave={(v) => onFieldSave('personalInfo.phone', v)}
                    />
                  )}
                  {(displayData.personalInfo?.email || displayData.personalInfo?.phone) && displayData.personalInfo?.city && ' | '}
                  {displayData.personalInfo?.city && (
                    <EditableField
                      tag="span"
                      value={displayData.personalInfo.city}
                      className="text-sm text-gray-600"
                      onSave={(v) => onFieldSave('personalInfo.city', v)}
                    />
                  )}
                </p>

                {/* Work Experience */}
                {displayData.workExperience &&
                  displayData.workExperience.length > 0 && (
                    <div className="mb-6">
                      <h2 className={sectionHeadingClass}>
                        Work Experience
                      </h2>
                      {displayData.workExperience.map((job, index) => (
                        <div key={index} className="mb-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold group flex items-center gap-1">
                                <EditableField
                                  tag="span"
                                  value={job.jobTitle}
                                  className="font-bold"
                                  onSave={(v) => onFieldSave(`workExperience[${index}].jobTitle`, v)}
                                />
                                <AIRewriteButton
                                  currentValue={job.jobTitle}
                                  fieldType="job_title"
                                  context={{ jobTitle: job.jobTitle, section: 'work' }}
                                  language={displayData.language}
                                  onRewriteComplete={(v) => onFieldSave(`workExperience[${index}].jobTitle`, v)}
                                />
                                {' | '}
                                <EditableField
                                  tag="span"
                                  value={job.companyName}
                                  className="font-bold"
                                  onSave={(v) => onFieldSave(`workExperience[${index}].companyName`, v)}
                                />
                              </p>
                              <p className="text-sm text-gray-600 italic">
                                <EditableField
                                  tag="span"
                                  value={job.startDate}
                                  className="text-sm text-gray-600 italic"
                                  onSave={(v) => onFieldSave(`workExperience[${index}].startDate`, v)}
                                />
                                {' - '}
                                <EditableField
                                  tag="span"
                                  value={job.isCurrentJob ? 'Present' : (job.endDate || '')}
                                  className="text-sm text-gray-600 italic"
                                  disabled={job.isCurrentJob}
                                  onSave={(v) => onFieldSave(`workExperience[${index}].endDate`, v)}
                                />
                                {' | '}
                                <EditableField
                                  tag="span"
                                  value={job.location}
                                  className="text-sm text-gray-600 italic"
                                  onSave={(v) => onFieldSave(`workExperience[${index}].location`, v)}
                                />
                              </p>
                            </div>
                          </div>
                          <ul className="mt-2 ml-4 list-disc text-sm">
                            {(
                              job.enhancedResponsibilities || job.responsibilities
                            )
                              .split('\n')
                              .filter((line) => line.trim())
                              .map((point, i) => {
                                const cleanPoint = point.replace(/^[-\u2022*]\s*/, '').trim();
                                return (
                                  <li key={i} className="mb-1 group flex items-start gap-1">
                                    <EditableField
                                      tag="span"
                                      value={cleanPoint}
                                      className="text-sm"
                                      onSave={(v) => onBulletSave(index, i, v)}
                                    />
                                    <AIRewriteButton
                                      currentValue={cleanPoint}
                                      fieldType="responsibility"
                                      context={{ jobTitle: job.jobTitle, section: 'work' }}
                                      language={displayData.language}
                                      onRewriteComplete={(v) => onBulletSave(index, i, v)}
                                    />
                                  </li>
                                );
                              })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                {/* Education */}
                {displayData.education && displayData.education.length > 0 && (
                  <div className="mb-6">
                    <h2 className={sectionHeadingClass}>
                      Education
                    </h2>
                    {displayData.education.map((edu, index) => (
                      <div key={index} className="mb-2">
                        <p className="font-bold">
                          <EditableField
                            tag="span"
                            value={expandDegreeAbbreviation(edu.degree)}
                            className="font-bold"
                            onSave={(v) => onFieldSave(`education[${index}].degree`, v)}
                          />
                          {edu.fieldOfStudy && (
                            <>
                              {' in '}
                              <EditableField
                                tag="span"
                                value={edu.fieldOfStudy}
                                className="font-bold"
                                onSave={(v) => onFieldSave(`education[${index}].fieldOfStudy`, v)}
                              />
                            </>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 italic">
                          <EditableField
                            tag="span"
                            value={edu.schoolName}
                            className="text-sm text-gray-600 italic"
                            onSave={(v) => onFieldSave(`education[${index}].schoolName`, v)}
                          />
                          {' | '}
                          <EditableField
                            tag="span"
                            value={edu.startYear}
                            className="text-sm text-gray-600 italic"
                            onSave={(v) => onFieldSave(`education[${index}].startYear`, v)}
                          />
                          {' - '}
                          <EditableField
                            tag="span"
                            value={edu.isCurrentlyStudying ? 'Present' : (edu.endYear || '')}
                            className="text-sm text-gray-600 italic"
                            disabled={edu.isCurrentlyStudying}
                            onSave={(v) => onFieldSave(`education[${index}].endYear`, v)}
                          />
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Volunteering */}
                {displayData.volunteering && displayData.volunteering.length > 0 && (
                  <div className="mb-6">
                    <h2 className={sectionHeadingClass}>
                      Volunteer Experience
                    </h2>
                    {displayData.volunteering.map((vol, index) => (
                      <div key={index} className="mb-3">
                        <div className="flex justify-between items-start">
                          <div className="group flex items-center gap-1">
                            <EditableField
                              tag="p"
                              value={vol.role}
                              className="font-bold"
                              onSave={(v) => onFieldSave(`volunteering[${index}].role`, v)}
                            />
                            <AIRewriteButton
                              currentValue={vol.role}
                              fieldType="role"
                              context={{ section: 'volunteering' }}
                              language={displayData.language}
                              onRewriteComplete={(v) => onFieldSave(`volunteering[${index}].role`, v)}
                            />
                          </div>
                          <span className="text-sm text-gray-600 italic">
                            <EditableField
                              tag="span"
                              value={vol.startDate}
                              className="text-sm text-gray-600 italic"
                              onSave={(v) => onFieldSave(`volunteering[${index}].startDate`, v)}
                            />
                            {' - '}
                            <EditableField
                              tag="span"
                              value={vol.endDate || 'Present'}
                              className="text-sm text-gray-600 italic"
                              onSave={(v) => onFieldSave(`volunteering[${index}].endDate`, v)}
                            />
                          </span>
                        </div>
                        <EditableField
                          tag="p"
                          value={vol.organizationName}
                          className="text-sm text-gray-700"
                          onSave={(v) => onFieldSave(`volunteering[${index}].organizationName`, v)}
                        />
                        {vol.responsibilities && (
                          <div className="group flex items-start gap-1">
                            <EditableField
                              tag="p"
                              value={vol.responsibilities}
                              className="mt-1 text-sm text-gray-600"
                              onSave={(v) => onVolunteerBulletSave(index, v)}
                            />
                            <AIRewriteButton
                              currentValue={vol.responsibilities}
                              fieldType="responsibility"
                              context={{ jobTitle: vol.role, section: 'volunteering' }}
                              language={displayData.language}
                              onRewriteComplete={(v) => onVolunteerBulletSave(index, v)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Skills */}
                {displayData.skills && (
                  displayData.skills.technicalSkills?.length > 0 ||
                  displayData.skills.softSkills?.length > 0 ||
                  displayData.skills.certifications?.length > 0 ||
                  displayData.skills.languages?.length > 0
                ) && (
                  <div className="mb-6">
                    <h2 className={sectionHeadingClass}>
                      Skills
                    </h2>
                    <ul className="text-sm ml-4">
                      {displayData.skills.technicalSkills?.length > 0 && (
                        <li className="mb-1">
                          <strong>Technical:</strong>{' '}
                          <EditableField
                            tag="span"
                            value={displayData.skills.technicalSkills.join(', ')}
                            className="text-sm"
                            onSave={(v) => onFieldSave(
                              'skills.technicalSkills',
                              v.split(',').map((s) => s.trim()).filter(Boolean)
                            )}
                          />
                        </li>
                      )}
                      {displayData.skills.softSkills?.length > 0 && (
                        <li className="mb-1">
                          <strong>Soft Skills:</strong>{' '}
                          <EditableField
                            tag="span"
                            value={displayData.skills.softSkills.join(', ')}
                            className="text-sm"
                            onSave={(v) => onFieldSave(
                              'skills.softSkills',
                              v.split(',').map((s) => s.trim()).filter(Boolean)
                            )}
                          />
                        </li>
                      )}
                      {displayData.skills.certifications?.length > 0 && (
                        <li className="mb-1">
                          <strong>Certifications:</strong>{' '}
                          <EditableField
                            tag="span"
                            value={displayData.skills.certifications.join(', ')}
                            className="text-sm"
                            onSave={(v) => onFieldSave(
                              'skills.certifications',
                              v.split(',').map((s) => s.trim()).filter(Boolean)
                            )}
                          />
                        </li>
                      )}
                      {displayData.skills.languages?.length > 0 && (
                        <li className="mb-1">
                          <strong>Languages:</strong>{' '}
                          <EditableField
                            tag="span"
                            value={displayData.skills.languages
                              .map((l) => `${l.language} (${l.proficiency})`)
                              .join(', ')}
                            className="text-sm"
                            onSave={(v) => {
                              const langs = v.split(',').map((s) => {
                                const match = s.trim().match(/^(.+?)\s*\((.+?)\)$/);
                                return match
                                  ? { language: match[1].trim(), proficiency: match[2].trim() }
                                  : { language: s.trim(), proficiency: 'professional' };
                              }).filter((l) => l.language);
                              onFieldSave('skills.languages', langs);
                            }}
                          />
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* References */}
                {displayData.references && displayData.references.length > 0 && (
                  <div className="mb-6">
                    <h2 className={sectionHeadingClass}>
                      References
                    </h2>
                    {displayData.references.map((ref, index) => (
                      <div key={index} className="mb-3">
                        <EditableField
                          tag="p"
                          value={ref.name}
                          className="font-bold"
                          onSave={(v) => onFieldSave(`references[${index}].name`, v)}
                        />
                        {ref.relationship && (
                          <EditableField
                            tag="p"
                            value={ref.relationship}
                            className="text-sm text-gray-600 italic"
                            onSave={(v) => onFieldSave(`references[${index}].relationship`, v)}
                          />
                        )}
                        <p className="text-sm text-gray-500">
                          {ref.email && (
                            <EditableField
                              tag="span"
                              value={ref.email}
                              className="text-sm text-gray-500"
                              onSave={(v) => onFieldSave(`references[${index}].email`, v)}
                            />
                          )}
                          {ref.email && ref.phone && ' | '}
                          {ref.phone && (
                            <EditableField
                              tag="span"
                              value={ref.phone}
                              className="text-sm text-gray-500"
                              onSave={(v) => onFieldSave(`references[${index}].phone`, v)}
                            />
                          )}
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
