import React from 'react';
import { Bot, User } from 'lucide-react';
import type { MessageRole } from '@/types';

interface ChatBubbleProps {
  role: MessageRole;
  content: string;
  timestamp?: string;
}

/**
 * Formats message content to highlight questions in bold yellow
 * - Questions are detected as sentences ending with ?
 * - Also handles markdown **bold** syntax by rendering it as styled text
 */
const formatMessageContent = (content: string, isAssistant: boolean): React.ReactNode => {
  if (!isAssistant) {
    return content;
  }

  // First, handle markdown bold (**text**) and convert to styled spans
  // Split by **bold** patterns
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let match;

  let processedContent = content;
  const boldMatches: { start: number; end: number; text: string }[] = [];

  while ((match = boldRegex.exec(content)) !== null) {
    boldMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[1],
    });
  }

  // If there are bold markers, process them
  if (boldMatches.length > 0) {
    boldMatches.forEach((boldMatch, idx) => {
      // Add text before this bold section
      if (boldMatch.start > lastIndex) {
        const textBefore = content.slice(lastIndex, boldMatch.start);
        parts.push(<span key={`text-${idx}`}>{textBefore}</span>);
      }

      // Add the bold text with yellow color (questions are typically in bold)
      parts.push(
        <span key={`bold-${idx}`} className="font-bold text-yellow-400">
          {boldMatch.text}
        </span>
      );

      lastIndex = boldMatch.end;
    });

    // Add any remaining text after the last bold section
    if (lastIndex < content.length) {
      parts.push(<span key="text-end">{content.slice(lastIndex)}</span>);
    }

    return parts;
  }

  // Fallback: If no markdown bold, detect questions by ? and style them
  const questionParts = content.split(/([^.!?]*[?])/g).filter(Boolean);

  return questionParts.map((part, index) => {
    if (part.trim().endsWith('?')) {
      return (
        <span key={index} className="font-bold text-yellow-400">
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  role,
  content,
  timestamp,
}) => {
  const isAssistant = role === 'assistant';

  return (
    <div
      className={`flex gap-3 ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div
        className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isAssistant
            ? 'bg-gradient-to-br from-green-500 to-cyan-500'
            : 'bg-gradient-to-br from-blue-500 to-purple-500'
          }
        `}
      >
        {isAssistant ? (
          <Bot className="w-4 h-4 text-white" />
        ) : (
          <User className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message */}
      <div
        className={`
          max-w-[80%] px-4 py-3 rounded-2xl
          ${isAssistant
            ? 'bg-[#1a1a1a] border border-[#27272a] rounded-tl-sm'
            : 'bg-gradient-to-r from-blue-600 to-cyan-600 rounded-tr-sm'
          }
        `}
      >
        <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
          {formatMessageContent(content, isAssistant)}
        </p>
        {timestamp && (
          <p className="text-xs text-[#71717a] mt-1.5">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  );
};

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-green-500 to-cyan-500">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-[#1a1a1a] border border-[#27272a] rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-[#71717a] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-[#71717a] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-[#71717a] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
