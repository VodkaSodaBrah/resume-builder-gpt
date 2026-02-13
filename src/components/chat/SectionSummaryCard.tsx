import React from 'react';
import { Check, Plus, Pencil } from 'lucide-react';
import type { ResumeData, QuestionCategory } from '@/types';

interface SectionSummaryCardProps {
  category: QuestionCategory;
  resumeData: Partial<ResumeData>;
  onConfirm: () => void;
  onAddAnother: () => void;
  onEdit: () => void;
}

const MULTI_ENTRY_SECTIONS: QuestionCategory[] = ['work', 'education', 'volunteering', 'references'];

const SECTION_LABELS: Partial<Record<QuestionCategory, string>> = {
  personal: 'Personal Information',
  work: 'Work Experience',
  education: 'Education',
  volunteering: 'Volunteering',
  skills: 'Skills',
  references: 'References',
};

const ADD_ANOTHER_LABELS: Partial<Record<QuestionCategory, string>> = {
  work: 'Add Another Job',
  education: 'Add Another School',
  volunteering: 'Add Another Experience',
  references: 'Add Another Reference',
};

function renderPersonal(data: Partial<ResumeData>) {
  const info = data.personalInfo;
  if (!info) return <p className="text-[#71717a] text-sm">No information provided yet.</p>;

  const fields = [
    { label: 'Name', value: info.fullName },
    { label: 'Email', value: info.email },
    { label: 'Phone', value: info.phone },
    { label: 'City', value: info.city },
    { label: 'Zip Code', value: info.zipCode },
  ].filter(f => f.value);

  return (
    <div className="space-y-1">
      {fields.map(f => (
        <div key={f.label} className="flex gap-2 text-sm">
          <span className="text-[#71717a] min-w-[60px]">{f.label}:</span>
          <span className="text-white">{f.value}</span>
        </div>
      ))}
    </div>
  );
}

function renderWork(data: Partial<ResumeData>) {
  const entries = data.workExperience;
  if (!entries?.length) return <p className="text-[#71717a] text-sm">No work experience added.</p>;

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => (
        <div key={entry.id || i} className="border-l-2 border-[#27272a] pl-3">
          <p className="text-white text-sm font-medium">
            {entry.jobTitle} at {entry.companyName}
          </p>
          <p className="text-[#71717a] text-xs">
            {entry.location} | {entry.startDate} - {entry.isCurrentJob ? 'Present' : entry.endDate}
          </p>
          {entry.responsibilities && (
            <p className="text-[#a1a1aa] text-xs mt-1 line-clamp-2">{entry.responsibilities}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function renderEducation(data: Partial<ResumeData>) {
  const entries = data.education;
  if (!entries?.length) return <p className="text-[#71717a] text-sm">No education added.</p>;

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => (
        <div key={entry.id || i} className="border-l-2 border-[#27272a] pl-3">
          <p className="text-white text-sm font-medium">
            {entry.degree}{entry.fieldOfStudy ? ` in ${entry.fieldOfStudy}` : ''}
          </p>
          <p className="text-[#71717a] text-xs">
            {entry.schoolName} | {entry.startYear} - {entry.isCurrentlyStudying ? 'Present' : entry.endYear}
          </p>
        </div>
      ))}
    </div>
  );
}

function renderVolunteering(data: Partial<ResumeData>) {
  const entries = data.volunteering;
  if (!entries?.length) return <p className="text-[#71717a] text-sm">No volunteering added.</p>;

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => (
        <div key={entry.id || i} className="border-l-2 border-[#27272a] pl-3">
          <p className="text-white text-sm font-medium">
            {entry.role} at {entry.organizationName}
          </p>
          <p className="text-[#71717a] text-xs">
            {entry.startDate} - {entry.endDate || 'Present'}
          </p>
          {entry.responsibilities && (
            <p className="text-[#a1a1aa] text-xs mt-1 line-clamp-2">{entry.responsibilities}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function renderSkills(data: Partial<ResumeData>) {
  const skills = data.skills;
  if (!skills) return <p className="text-[#71717a] text-sm">No skills added.</p>;

  const sections = [
    { label: 'Technical', items: skills.technicalSkills },
    { label: 'Certifications', items: skills.certifications },
    { label: 'Languages', items: skills.languages?.map(l => `${l.language} (${l.proficiency})`) },
    { label: 'Soft Skills', items: skills.softSkills },
  ].filter(s => s.items?.length);

  if (!sections.length) return <p className="text-[#71717a] text-sm">No skills added.</p>;

  return (
    <div className="space-y-2">
      {sections.map(s => (
        <div key={s.label}>
          <p className="text-[#71717a] text-xs font-medium">{s.label}:</p>
          <p className="text-white text-sm">{s.items!.join(', ')}</p>
        </div>
      ))}
    </div>
  );
}

function renderReferences(data: Partial<ResumeData>) {
  if (data.referencesUponRequest) {
    return <p className="text-white text-sm">Available upon request</p>;
  }

  const entries = data.references;
  if (!entries?.length) return <p className="text-[#71717a] text-sm">No references added.</p>;

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => (
        <div key={entry.id || i} className="border-l-2 border-[#27272a] pl-3">
          <p className="text-white text-sm font-medium">{entry.name}</p>
          <p className="text-[#71717a] text-xs">
            {entry.jobTitle} at {entry.company}
          </p>
          <p className="text-[#a1a1aa] text-xs">
            {entry.phone || entry.email} | {entry.relationship}
          </p>
        </div>
      ))}
    </div>
  );
}

const SECTION_RENDERERS: Partial<Record<QuestionCategory, (data: Partial<ResumeData>) => React.ReactNode>> = {
  personal: renderPersonal,
  work: renderWork,
  education: renderEducation,
  volunteering: renderVolunteering,
  skills: renderSkills,
  references: renderReferences,
};

export const SectionSummaryCard: React.FC<SectionSummaryCardProps> = ({
  category,
  resumeData,
  onConfirm,
  onAddAnother,
  onEdit,
}) => {
  const renderer = SECTION_RENDERERS[category];
  const isMultiEntry = MULTI_ENTRY_SECTIONS.includes(category);
  const sectionLabel = SECTION_LABELS[category] || category;
  const addAnotherLabel = ADD_ANOTHER_LABELS[category] || 'Add Another';

  return (
    <div className="w-full max-w-md bg-[#111111] border border-[#27272a] rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <h3 className="text-white text-sm font-semibold">{sectionLabel} Summary</h3>
      </div>

      {/* Content */}
      <div className="pl-2">
        {renderer ? renderer(resumeData) : <p className="text-[#71717a] text-sm">No data.</p>}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[#27272a]">
        <button
          onClick={onConfirm}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
        >
          <Check className="w-4 h-4" />
          Looks Good, Continue
        </button>

        {isMultiEntry && (
          <button
            onClick={onAddAnother}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-white text-sm font-medium rounded-lg border border-[#27272a] hover:bg-[#27272a] transition-all"
          >
            <Plus className="w-4 h-4" />
            {addAnotherLabel}
          </button>
        )}

        <button
          onClick={onEdit}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[#a1a1aa] text-sm rounded-lg hover:text-white hover:bg-[#1a1a1a] transition-all"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit Something
        </button>
      </div>
    </div>
  );
};
