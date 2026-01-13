import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Mail, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface GmailGuideCardProps {
  onComplete?: () => void;
  suggestedUsername?: string;
}

export const GmailGuideCard: React.FC<GmailGuideCardProps> = ({
  onComplete,
  suggestedUsername,
}) => {
  const { t } = useTranslation();
  const [expandedSection, setExpandedSection] = useState<string | null>('why');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const usernameExamples = suggestedUsername
    ? [
        suggestedUsername.toLowerCase().replace(/\s+/g, '.'),
        suggestedUsername.toLowerCase().replace(/\s+/g, ''),
        `${suggestedUsername.toLowerCase().replace(/\s+/g, '.')}${new Date().getFullYear() % 100}`,
      ]
    : ['john.smith', 'johnsmith', 'john.smith.professional'];

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111111] border border-[#27272a] rounded-xl p-5 max-w-md shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">
            {t('gmail.title', 'Create a Professional Email')}
          </h3>
          <p className="text-[#71717a] text-sm">
            {t('gmail.subtitle', "It's free and takes about 5 minutes")}
          </p>
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="space-y-2 mb-4">
        {/* Why You Need an Email */}
        <div className="border border-[#27272a] rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('why')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-[#1a1a1a] transition-colors"
          >
            <span className="text-white font-medium text-sm">
              {t('gmail.whyTitle', 'Why do I need an email?')}
            </span>
            {expandedSection === 'why' ? (
              <ChevronUp className="w-4 h-4 text-[#71717a]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#71717a]" />
            )}
          </button>
          {expandedSection === 'why' && (
            <div className="px-3 pb-3 text-sm text-[#a1a1aa] space-y-2">
              <p>An email address is essential for job applications because:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Employers need a way to contact you</li>
                <li>Most job applications require an email</li>
                <li>A professional email makes a good first impression</li>
                <li>You'll receive interview invitations and job offers via email</li>
              </ul>
            </div>
          )}
        </div>

        {/* Professional Username Tips */}
        <div className="border border-[#27272a] rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('username')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-[#1a1a1a] transition-colors"
          >
            <span className="text-white font-medium text-sm">
              {t('gmail.usernameTitle', 'Choosing a professional username')}
            </span>
            {expandedSection === 'username' ? (
              <ChevronUp className="w-4 h-4 text-[#71717a]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#71717a]" />
            )}
          </button>
          {expandedSection === 'username' && (
            <div className="px-3 pb-3 text-sm text-[#a1a1aa] space-y-2">
              <p className="text-green-400 font-medium">Good examples:</p>
              <ul className="space-y-1 ml-2">
                {usernameExamples.map((example, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>{example}@gmail.com</span>
                  </li>
                ))}
              </ul>
              <p className="text-red-400 font-medium mt-2">Avoid:</p>
              <ul className="space-y-1 ml-2 text-[#71717a]">
                <li>- Nicknames (coolcat123@gmail.com)</li>
                <li>- Numbers that look like birth years</li>
                <li>- Inappropriate words or phrases</li>
              </ul>
            </div>
          )}
        </div>

        {/* How to Create */}
        <div className="border border-[#27272a] rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('steps')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-[#1a1a1a] transition-colors"
          >
            <span className="text-white font-medium text-sm">
              {t('gmail.stepsTitle', 'How to create a Gmail account')}
            </span>
            {expandedSection === 'steps' ? (
              <ChevronUp className="w-4 h-4 text-[#71717a]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#71717a]" />
            )}
          </button>
          {expandedSection === 'steps' && (
            <div className="px-3 pb-3 text-sm text-[#a1a1aa] space-y-2">
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to <span className="text-blue-400">gmail.com</span></li>
                <li>Click "Create account"</li>
                <li>Select "For myself"</li>
                <li>Enter your first and last name</li>
                <li>Choose a professional username (see tips above)</li>
                <li>Create a strong password you'll remember</li>
                <li>Add a phone number for security (recommended)</li>
                <li>Agree to terms and you're done!</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <a
          href="https://accounts.google.com/signup"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
        >
          <ExternalLink className="w-4 h-4" />
          {t('gmail.createButton', 'Create Gmail Account')}
        </a>

        {onComplete && (
          <button
            onClick={onComplete}
            className="w-full py-2 text-[#a1a1aa] hover:text-white text-sm transition-colors"
          >
            {t('gmail.continueButton', "I've created my email, continue")}
          </button>
        )}
      </div>

      <p className="text-center text-[#52525b] text-xs mt-3">
        {t('gmail.freeNote', 'Gmail is free and provided by Google')}
      </p>
    </div>
  );
};
