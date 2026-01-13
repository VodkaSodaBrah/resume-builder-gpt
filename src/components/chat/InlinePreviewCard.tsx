import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { ResumeData } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

interface InlinePreviewCardProps {
  resumeData: Partial<ResumeData>;
  onViewFull?: () => void;
}

export const InlinePreviewCard: React.FC<InlinePreviewCardProps> = ({
  resumeData,
  onViewFull,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleViewFull = () => {
    if (onViewFull) {
      onViewFull();
    } else {
      navigate('/preview/new', { state: { resumeData } });
    }
  };

  // Extract key data for display with proper typing
  const personalInfo = (resumeData.personalInfo || {}) as {
    fullName?: string;
    email?: string;
    phone?: string;
  };
  const workExperience = (resumeData.workExperience || []) as Array<{
    jobTitle?: string;
    companyName?: string;
  }>;
  const education = (resumeData.education || []) as Array<{
    schoolName?: string;
    degree?: string;
  }>;
  const skills = (resumeData.skills || {}) as {
    technicalSkills?: string[];
    softSkills?: string[];
  };

  // Get job titles for display
  const jobTitles = workExperience
    .filter((job) => job?.jobTitle)
    .map((job) => job.jobTitle as string)
    .slice(0, 3);

  // Get skills summary
  const allSkills = [
    ...(Array.isArray(skills.technicalSkills) ? skills.technicalSkills : []),
    ...(Array.isArray(skills.softSkills) ? skills.softSkills : []),
  ].slice(0, 5);

  // Parse skills if they're strings
  const parsedSkills = allSkills.flatMap((skill) =>
    typeof skill === 'string' ? skill.split(',').map((s) => s.trim()) : [skill]
  ).filter(Boolean).slice(0, 5);

  return (
    <div className="bg-[#1a1a1a] border border-[#27272a] rounded-lg p-4 max-w-md">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {personalInfo.fullName?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">
            {personalInfo.fullName || 'Your Name'}
          </h3>
          <p className="text-[#71717a] text-sm">
            {personalInfo.email || 'email@example.com'}
          </p>
        </div>
      </div>

      {/* Preview Content */}
      <div className="space-y-3 mb-4">
        {/* Work Experience Summary */}
        {jobTitles.length > 0 && (
          <div>
            <p className="text-[#a1a1aa] text-xs uppercase tracking-wider mb-1">
              {t('categories.work', 'Experience')}
            </p>
            <div className="flex flex-wrap gap-1">
              {jobTitles.map((title, idx) => (
                <span
                  key={idx}
                  className="bg-[#27272a] text-[#e4e4e7] text-xs px-2 py-1 rounded"
                >
                  {title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education Summary */}
        {education.length > 0 && education[0]?.schoolName && (
          <div>
            <p className="text-[#a1a1aa] text-xs uppercase tracking-wider mb-1">
              {t('categories.education', 'Education')}
            </p>
            <p className="text-[#e4e4e7] text-sm">
              {education[0].degree && `${education[0].degree} - `}
              {education[0].schoolName}
            </p>
          </div>
        )}

        {/* Skills Summary */}
        {parsedSkills.length > 0 && (
          <div>
            <p className="text-[#a1a1aa] text-xs uppercase tracking-wider mb-1">
              {t('categories.skills', 'Skills')}
            </p>
            <div className="flex flex-wrap gap-1">
              {parsedSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-[#27272a] text-[#e4e4e7] text-xs px-2 py-1 rounded"
                >
                  {skill}
                </span>
              ))}
              {parsedSkills.length < (skills.technicalSkills?.length || 0) + (skills.softSkills?.length || 0) && (
                <span className="text-[#71717a] text-xs px-1">
                  +more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View Full Preview Button */}
      <button
        onClick={handleViewFull}
        className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
      >
        {t('ui.preview', 'View Full Preview')}
      </button>

      {/* Template indicator */}
      {resumeData.templateStyle && (
        <p className="text-center text-[#71717a] text-xs mt-2">
          {t('templates.' + resumeData.templateStyle, resumeData.templateStyle)} {t('ui.selectTemplate', 'template')}
        </p>
      )}
    </div>
  );
};
