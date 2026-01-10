import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useConversationStore } from '@/stores/conversationStore';

export const Builder: React.FC = () => {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  const { isComplete, resumeData, resetConversation } = useConversationStore();

  // Reset conversation when starting fresh (no resumeId)
  useEffect(() => {
    if (!resumeId) {
      resetConversation();
    }
  }, [resumeId, resetConversation]);

  // Load existing resume if editing
  useEffect(() => {
    if (resumeId && token) {
      loadResume();
    }
  }, [resumeId, token]);

  const loadResume = async () => {
    try {
      const response = await fetch(`/api/resume/${resumeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        // Set resume data to store for editing
        useConversationStore.getState().setResumeData(data.resume.data);
      }
    } catch (error) {
      console.error('Failed to load resume:', error);
    }
  };

  // Redirect to preview when complete
  useEffect(() => {
    if (isComplete && resumeData) {
      // Navigate to preview/download page
      navigate('/preview', { state: { resumeData } });
    }
  }, [isComplete, resumeData, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-[#27272a] bg-[#111111]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-green-500 font-mono text-sm">&lt;</span>
              <span className="text-white text-sm font-medium">Resume Builder</span>
              <span className="text-green-500 font-mono text-sm">/&gt;</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto flex flex-col">
        <div className="flex-1 flex flex-col">
          <ChatContainer />
        </div>
      </main>
    </div>
  );
};
