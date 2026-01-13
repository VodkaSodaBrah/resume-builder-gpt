/**
 * EmailHelpCard Component
 * Displays an expandable inline guide for creating a Gmail account
 * Designed for tech-illiterate users with clear, step-by-step instructions
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmailHelpCardProps {
  content: string;
  onEmailCreated?: () => void;
  onSkip?: () => void;
  language?: string;
}

export const EmailHelpCard: React.FC<EmailHelpCardProps> = ({
  content,
  onEmailCreated,
  onSkip,
  language = 'en',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Parse the markdown-like content into sections
  const renderContent = () => {
    // Split content by headers and render appropriately
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-2 mb-4">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[#a1a1aa]">
                <span className="text-green-500 mt-1">-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) {
        flushList();
        return;
      }

      // H2 headers
      if (trimmedLine.startsWith('## ')) {
        flushList();
        elements.push(
          <h3 key={`h2-${index}`} className="text-lg font-semibold text-white mt-4 mb-2">
            {trimmedLine.replace('## ', '')}
          </h3>
        );
        return;
      }

      // Bold text (headers within content)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        flushList();
        elements.push(
          <p key={`bold-${index}`} className="font-semibold text-white mt-3 mb-1">
            {trimmedLine.replace(/\*\*/g, '')}
          </p>
        );
        return;
      }

      // List items
      if (trimmedLine.startsWith('- ')) {
        inList = true;
        listItems.push(trimmedLine.replace('- ', ''));
        return;
      }

      // Numbered list items
      if (/^\d+\.\s/.test(trimmedLine)) {
        flushList();
        const match = trimmedLine.match(/^(\d+)\.\s\*\*(.+?)\*\*:?\s*(.*)$/);
        if (match) {
          const [, num, title, description] = match;
          elements.push(
            <div key={`step-${index}`} className="flex items-start gap-3 mb-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-500 text-sm font-bold flex items-center justify-center">
                {num}
              </span>
              <div>
                <span className="font-semibold text-white">{title}</span>
                {description && (
                  <span className="text-[#a1a1aa]">: {description}</span>
                )}
              </div>
            </div>
          );
        } else {
          elements.push(
            <div key={`step-${index}`} className="flex items-start gap-3 mb-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-500 text-sm font-bold flex items-center justify-center">
                {trimmedLine.match(/^\d+/)?.[0]}
              </span>
              <span className="text-[#a1a1aa]">
                {trimmedLine.replace(/^\d+\.\s*/, '')}
              </span>
            </div>
          );
        }
        return;
      }

      // Links
      if (trimmedLine.includes('](')) {
        flushList();
        const linkMatch = trimmedLine.match(/\[(.+?)\]\((.+?)\)/);
        if (linkMatch) {
          const [, text, url] = linkMatch;
          const beforeLink = trimmedLine.split('[')[0];
          elements.push(
            <p key={`link-${index}`} className="text-[#a1a1aa] mb-2">
              {beforeLink}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
              >
                {text}
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          );
          return;
        }
      }

      // Regular text
      flushList();
      elements.push(
        <p key={`text-${index}`} className="text-[#a1a1aa] mb-2">
          {trimmedLine}
        </p>
      );
    });

    flushList();
    return elements;
  };

  return (
    <div className="max-w-md bg-[#1a1a1a] border border-[#27272a] rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-[#111111] hover:bg-[#1a1a1a] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white">Need an email address?</h3>
            <p className="text-sm text-[#71717a]">I can help you create one</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-[#71717a]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#71717a]" />
        )}
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 py-4 border-t border-[#27272a]">
          {/* Guide Content */}
          <div className="text-sm max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {renderContent()}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-4 border-t border-[#27272a] space-y-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={onEmailCreated}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              I created my email
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={onSkip}
            >
              Skip for now
            </Button>
          </div>

          {/* External Help Link */}
          <p className="mt-3 text-center text-xs text-[#71717a]">
            Need more help?{' '}
            <a
              href="https://support.google.com/mail/answer/56256"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
            >
              View detailed guide
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      )}
    </div>
  );
};
