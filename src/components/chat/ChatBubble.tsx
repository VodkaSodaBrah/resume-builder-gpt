import React from 'react';
import { Bot, User } from 'lucide-react';
import type { MessageRole } from '@/types';

interface ChatBubbleProps {
  role: MessageRole;
  content: string;
  timestamp?: string;
}

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
          {content}
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
