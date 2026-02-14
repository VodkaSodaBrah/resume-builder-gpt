import React from 'react';

interface AIRewriteSuggestionProps {
  original: string;
  suggestion: string;
  onAccept: () => void;
  onReject: () => void;
}

export const AIRewriteSuggestion: React.FC<AIRewriteSuggestionProps> = ({
  original,
  suggestion,
  onAccept,
  onReject,
}) => {
  return (
    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
      <div className="mb-2">
        <span className="text-gray-500 text-xs font-medium">Original:</span>
        <p className="text-gray-600 line-through">{original}</p>
      </div>
      <div className="mb-3">
        <span className="text-blue-600 text-xs font-medium">Suggestion:</span>
        <p className="text-blue-900">{suggestion}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
        >
          Accept
        </button>
        <button
          onClick={onReject}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  );
};
