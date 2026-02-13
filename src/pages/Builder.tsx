import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, List } from 'lucide-react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { AIChatContainer } from '@/components/chat/AIChatContainer';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useConversationStore } from '@/stores/conversationStore';
import { useAIConversationStore } from '@/stores/aiConversationStore';
import { getResume, createResume, updateResume, type ResumeData } from '@/lib/supabase';

// Test data for dev mode auto-fill
const TEST_RESUME_DATA: Partial<ResumeData> = {
  language: 'en',
  personalInfo: {
    fullName: 'John Test Smith',
    email: 'john.test@example.com',
    phone: '(555) 123-4567',
    city: 'San Francisco, CA',
    zipCode: '94102',
  },
  hasWorkExperience: true,
  workExperience: [
    {
      id: 'test-work-1',
      companyName: 'Tech Startup Inc',
      jobTitle: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: 'January 2022',
      endDate: '',
      isCurrentJob: true,
      responsibilities: 'Led development of key features, mentored junior developers, improved system performance by 40%',
    },
    {
      id: 'test-work-2',
      companyName: 'Big Corp LLC',
      jobTitle: 'Software Developer',
      location: 'New York, NY',
      startDate: 'June 2019',
      endDate: 'December 2021',
      isCurrentJob: false,
      responsibilities: 'Developed web applications, collaborated with cross-functional teams, maintained legacy systems',
    },
  ],
  education: [
    {
      id: 'test-edu-1',
      schoolName: 'University of California, Berkeley',
      degree: 'BS',
      fieldOfStudy: 'Computer Science',
      startYear: '2015',
      endYear: '2019',
      isCurrentlyStudying: false,
    },
  ],
  hasVolunteering: false,
  skills: {
    technicalSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'],
    softSkills: ['Leadership', 'Communication', 'Problem Solving'],
    languages: [{ language: 'English', proficiency: 'native' }],
    certifications: ['AWS Certified Developer'],
  },
  hasReferences: false,
  referencesUponRequest: true,
  templateStyle: 'modern',
};

export const Builder: React.FC = () => {
  const { resumeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoaded } = useAuth();

  // Determine mode from URL param (default to Guided mode)
  const modeParam = searchParams.get('mode');
  const editSection = searchParams.get('editSection');
  const [useAIMode, setUseAIMode] = useState(modeParam === 'ai');

  // Section-to-question index mapping for edit mode
  // These indices correspond to the first question in each section
  const SECTION_QUESTION_INDICES: Record<string, number> = {
    personal: 2,      // personal_name
    work: 7,          // work_has_experience
    education: 17,    // education_school
    volunteering: 23, // volunteering_has
    skills: 29,       // skills_has_technical
    references: 37,   // references_has
  };

  // Get state from appropriate store based on mode
  const linearStore = useConversationStore();
  const aiStore = useAIConversationStore();

  const isComplete = useAIMode ? aiStore.isComplete : linearStore.isComplete;
  const resumeData = useAIMode ? aiStore.resumeData : linearStore.resumeData;
  const resetConversation = useAIMode
    ? aiStore.actions.resetConversation
    : linearStore.resetConversation;

  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasSaved = useRef(false);

  // Toggle between AI and classic modes
  const toggleMode = useCallback(() => {
    const newMode = !useAIMode;
    setUseAIMode(newMode);
    setSearchParams(newMode ? { mode: 'ai' } : {});

    // Reset the appropriate store when switching
    if (newMode) {
      aiStore.actions.resetConversation();
    } else {
      linearStore.resetConversation();
    }
  }, [useAIMode, setSearchParams, aiStore.actions, linearStore]);

  // Dev mode: Auto-fill with test data (Ctrl+Shift+D)
  const fillTestData = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log('[DEV] Filling test data and jumping to review...');
      const store = useConversationStore.getState();

      // Reset first
      store.resetConversation();

      // Fill with test data
      store.setResumeData(TEST_RESUME_DATA);

      // Jump to review_confirm question (index 39 - second to last question)
      // Questions: 0-38 are all other questions, 39 is review_confirm, 40 is complete
      store.goToQuestion(39); // review_confirm is at index 39

      // Add some mock messages to simulate the conversation
      store.addMessage({
        role: 'assistant',
        content: "[DEV MODE] Test data loaded! You're now at the review stage.",
      });
      store.addMessage({
        role: 'assistant',
        content: "I'm now going to create your resume! I'll improve the descriptions you gave me to make them sound more professional and attractive to employers. Ready to generate your resume?",
        questionId: 'review_confirm',
      });

      console.log('[DEV] Test data loaded. Current question index:', store.currentQuestionIndex);
    }
  }, []);

  // Dev mode keyboard shortcut
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+D to fill test data
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        fillTestData();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fillTestData]);

  // Reset conversation when starting fresh (no resumeId)
  useEffect(() => {
    if (!resumeId) {
      resetConversation();
      hasSaved.current = false;
    }
  }, [resumeId, resetConversation]);

  // Load existing resume if editing
  useEffect(() => {
    if (resumeId && isLoaded && user) {
      loadResume();
    }
  }, [resumeId, isLoaded, user]);

  // Handle editSection parameter - jump to specific section
  useEffect(() => {
    if (editSection && SECTION_QUESTION_INDICES[editSection] !== undefined) {
      const questionIndex = SECTION_QUESTION_INDICES[editSection];
      console.log(`[Edit Mode] Navigating to section: ${editSection}, question index: ${questionIndex}`);

      // Use the appropriate store based on mode
      if (useAIMode) {
        // For AI mode, use setCurrentSection to navigate to the section
        const aiActions = useAIConversationStore.getState().actions;
        aiActions.setCurrentSection(editSection as import('@/types').QuestionCategory);
        aiActions.addMessage({
          role: 'assistant',
          content: `I see you want to edit your ${editSection === 'personal' ? 'personal information' : editSection}. What would you like to change?`,
        });
      } else {
        // For linear mode, use goToQuestion
        const linearActions = useConversationStore.getState();
        linearActions.goToQuestion(questionIndex);
      }

      // Clear the editSection param to prevent re-triggering
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('editSection');
      setSearchParams(newParams, { replace: true });
    }
  }, [editSection, useAIMode, searchParams, setSearchParams]);

  const loadResume = async () => {
    if (!user) return;

    setIsLoadingResume(true);
    try {
      const resume = await getResume(resumeId!, user.id);
      if (resume) {
        // Set resume data to store for editing
        useConversationStore.getState().setResumeData(resume.resume_data);
      }
    } catch (error) {
      console.error('Failed to load resume:', error);
    } finally {
      setIsLoadingResume(false);
    }
  };

  // Save and redirect to preview when complete
  useEffect(() => {
    if (isComplete && resumeData && user && !hasSaved.current && !isSaving) {
      saveAndNavigate();
    }
  }, [isComplete, resumeData, user, isSaving]);

  const saveAndNavigate = async () => {
    if (!user || !resumeData || hasSaved.current) return;

    // Validate we have minimum required data
    const data = resumeData as ResumeData;
    if (!data.personalInfo?.fullName) {
      console.error('Resume data incomplete - missing fullName');
      // Don't save/navigate if we don't have basic info
      return;
    }

    hasSaved.current = true;
    setIsSaving(true);

    try {
      const name = data.personalInfo.fullName || 'Untitled Resume';

      let savedResumeId = resumeId;
      if (resumeId) {
        // Update existing resume
        await updateResume(resumeId, user.id, { resume_data: data });
      } else {
        // Create new resume
        const newResume = await createResume(user.id, name, data);
        savedResumeId = newResume.id;
      }

      // Navigate to preview with the saved resume ID
      navigate(`/preview/${savedResumeId}`, { state: { resumeData: data } });
    } catch (error) {
      console.error('Failed to save resume:', error);
      hasSaved.current = false;
      // Navigate anyway with the data in state (use 'new' as placeholder ID)
      navigate('/preview/new', { state: { resumeData: data } });
    } finally {
      setIsSaving(false);
    }
  };

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

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-green-500 font-mono text-sm">&lt;</span>
                <span className="text-white text-sm font-medium">Resume Builder</span>
                <span className="text-green-500 font-mono text-sm">/&gt;</span>
              </div>


              {import.meta.env.DEV && (
                <button
                  onClick={fillTestData}
                  className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-500"
                  title="Fill with test data (Ctrl+Shift+D)"
                >
                  DEV: Fill Test Data
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto flex flex-col">
        <div className="flex-1 flex flex-col">
          {useAIMode ? <AIChatContainer /> : <ChatContainer />}
        </div>
      </main>
    </div>
  );
};
