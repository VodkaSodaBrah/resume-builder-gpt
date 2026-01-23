import React, { useState } from 'react';
import type { ResumeData, TemplateStyle } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

interface LivePreviewPanelProps {
  resumeData: Partial<ResumeData>;
  onTemplateChange?: (template: TemplateStyle) => void;
  isVisible: boolean;
}

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  resumeData,
  onTemplateChange,
  isVisible,
}) => {
  const { t } = useTranslation();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateStyle>(
    resumeData.templateStyle || 'classic'
  );

  const handleTemplateChange = (template: TemplateStyle) => {
    setSelectedTemplate(template);
    if (onTemplateChange) {
      onTemplateChange(template);
    }
  };

  // Extract data with proper typing
  const personalInfo = (resumeData.personalInfo || {}) as {
    fullName?: string;
    email?: string;
    phone?: string;
    city?: string;
  };
  const workExperience = (resumeData.workExperience || []) as Array<{
    jobTitle?: string;
    companyName?: string;
    startDate?: string;
    endDate?: string;
    isCurrentJob?: boolean;
    responsibilities?: string;
  }>;
  const education = (resumeData.education || []) as Array<{
    schoolName?: string;
    degree?: string;
    startYear?: string;
    endYear?: string;
    isCurrentlyStudying?: boolean;
  }>;
  const skills = (resumeData.skills || {}) as {
    technicalSkills?: string[];
    softSkills?: string[];
    certifications?: string[];
  };

  // Parse skills if they're comma-separated strings
  const parseSkills = (skillArray?: string[]) => {
    if (!Array.isArray(skillArray)) return [];
    return skillArray.flatMap((skill) =>
      typeof skill === 'string' ? skill.split(',').map((s) => s.trim()) : [skill]
    ).filter(Boolean);
  };

  const technicalSkills = parseSkills(skills.technicalSkills);
  const softSkills = parseSkills(skills.softSkills);
  const certifications = parseSkills(skills.certifications);

  if (!isVisible) return null;

  return (
    <div className="flex flex-col h-full bg-[#111111] border-l border-[#27272a]">
      {/* Preview Header */}
      <div className="p-4 border-b border-[#27272a]">
        <h3 className="text-white font-semibold text-lg mb-3">
          {t('ui.livePreview', 'Live Preview')}
        </h3>

        {/* Template Selector */}
        <div className="space-y-2">
          <p className="text-xs text-[#71717a] uppercase tracking-wider">
            {t('ui.template', 'Template Style')}
          </p>
          <div className="flex gap-2">
            {(['classic', 'modern', 'professional'] as TemplateStyle[]).map((template) => (
              <button
                key={template}
                onClick={() => handleTemplateChange(template)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  selectedTemplate === template
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-[#1a1a1a] text-[#a1a1aa] hover:bg-[#27272a]'
                }`}
              >
                {t(`templates.${template}`, template.charAt(0).toUpperCase() + template.slice(1))}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Preview Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
        {/* Personal Info Section */}
        {personalInfo.fullName && (
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#27272a]">
            <h4 className="text-white font-bold text-xl mb-2">
              {personalInfo.fullName}
            </h4>
            {personalInfo.email && (
              <p className="text-[#a1a1aa] text-sm">{personalInfo.email}</p>
            )}
            {personalInfo.phone && (
              <p className="text-[#a1a1aa] text-sm">{personalInfo.phone}</p>
            )}
            {personalInfo.city && (
              <p className="text-[#a1a1aa] text-sm">{personalInfo.city}</p>
            )}
          </div>
        )}

        {/* Work Experience Section */}
        {workExperience.length > 0 && workExperience[0]?.companyName && (
          <div className="space-y-3">
            <h5 className="text-[#a1a1aa] text-xs uppercase tracking-wider font-semibold">
              {t('categories.work', 'Work Experience')}
            </h5>
            {workExperience.map((job, idx) => (
              job.companyName && (
                <div key={idx} className="bg-[#1a1a1a] rounded-lg p-3 border border-[#27272a]">
                  <p className="text-white font-semibold">{job.jobTitle}</p>
                  <p className="text-[#71717a] text-xs">{job.companyName}</p>
                  {job.startDate && (
                    <p className="text-[#52525b] text-xs mt-1">
                      {job.startDate} - {job.isCurrentJob ? 'Present' : job.endDate || 'Present'}
                    </p>
                  )}
                  {job.responsibilities && (
                    <p className="text-[#a1a1aa] text-xs mt-2 line-clamp-2">
                      {job.responsibilities}
                    </p>
                  )}
                </div>
              )
            ))}
          </div>
        )}

        {/* Education Section */}
        {education.length > 0 && education[0]?.schoolName && (
          <div className="space-y-3">
            <h5 className="text-[#a1a1aa] text-xs uppercase tracking-wider font-semibold">
              {t('categories.education', 'Education')}
            </h5>
            {education.map((edu, idx) => (
              edu.schoolName && (
                <div key={idx} className="bg-[#1a1a1a] rounded-lg p-3 border border-[#27272a]">
                  <p className="text-white font-semibold">{edu.degree}</p>
                  <p className="text-[#71717a] text-xs">{edu.schoolName}</p>
                  {edu.startYear && (
                    <p className="text-[#52525b] text-xs mt-1">
                      {edu.startYear} - {edu.isCurrentlyStudying ? 'Present' : edu.endYear || 'Present'}
                    </p>
                  )}
                </div>
              )
            ))}
          </div>
        )}

        {/* Skills Section */}
        {(technicalSkills.length > 0 || softSkills.length > 0 || certifications.length > 0) && (
          <div className="space-y-3">
            <h5 className="text-[#a1a1aa] text-xs uppercase tracking-wider font-semibold">
              {t('categories.skills', 'Skills')}
            </h5>

            {/* Technical Skills */}
            {technicalSkills.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#27272a]">
                <p className="text-[#71717a] text-xs mb-2 font-medium">Technical Skills</p>
                <div className="flex flex-wrap gap-1">
                  {technicalSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-[#27272a] text-[#e4e4e7] text-xs px-2 py-1 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Soft Skills */}
            {softSkills.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#27272a]">
                <p className="text-[#71717a] text-xs mb-2 font-medium">Soft Skills</p>
                <div className="flex flex-wrap gap-1">
                  {softSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-[#27272a] text-[#e4e4e7] text-xs px-2 py-1 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#27272a]">
                <p className="text-[#71717a] text-xs mb-2 font-medium">Certifications</p>
                <div className="flex flex-wrap gap-1">
                  {certifications.map((cert, idx) => (
                    <span
                      key={idx}
                      className="bg-[#27272a] text-[#e4e4e7] text-xs px-2 py-1 rounded"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!personalInfo.fullName && workExperience.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[#71717a] text-sm">
              {t('ui.previewEmpty', 'Your resume will appear here as you answer questions')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
