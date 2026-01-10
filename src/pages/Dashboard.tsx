import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  FileText,
  Download,
  Edit,
  Trash2,
  LogOut,
  Clock,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useAnalyticsStore, AnalyticsEvents } from '@/stores/analyticsStore';

interface ResumeListItem {
  id: string;
  templateStyle: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  personalInfo?: { fullName: string; email: string };
}

export const Dashboard: React.FC = () => {
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user, token, logout } = useAuthStore();
  const { trackEvent } = useAnalyticsStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resume/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setResumes(data.resumes);
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    trackEvent(AnalyticsEvents.LOGOUT);
    logout();
    navigate('/login');
  };

  const handleNewResume = () => {
    trackEvent(AnalyticsEvents.RESUME_START);
    navigate('/builder');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTemplateLabel = (style: string) => {
    const labels: Record<string, string> = {
      classic: 'Classic',
      modern: 'Modern',
      professional: 'Professional',
    };
    return labels[style] || style;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#27272a] bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-green-500 font-mono text-lg">&lt;</span>
              <span className="text-white font-semibold">Resume Builder</span>
              <span className="text-green-500 font-mono text-lg">/&gt;</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[#a1a1aa]">
                <User className="w-4 h-4" />
                <span className="text-sm">{user?.fullName || user?.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome back, {user?.fullName?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-[#a1a1aa]">
            Manage your resumes and create new ones to land your dream job.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={handleNewResume}
            className="p-6 bg-gradient-to-br from-green-500/10 to-cyan-500/10 border border-green-500/30 rounded-xl text-left hover:border-green-500/50 transition-all group"
          >
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500/30 transition-colors">
              <Plus className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Create New Resume</h3>
            <p className="text-sm text-[#a1a1aa]">
              Start fresh with our guided builder
            </p>
          </button>

          <div className="p-6 bg-[#111111] border border-[#27272a] rounded-xl">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              {resumes.length} Resume{resumes.length !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-[#a1a1aa]">
              Total resumes created
            </p>
          </div>

          <div className="p-6 bg-[#111111] border border-[#27272a] rounded-xl">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              {resumes.length > 0
                ? formatDate(resumes[0]?.updatedAt)
                : 'No activity'}
            </h3>
            <p className="text-sm text-[#a1a1aa]">
              Last updated
            </p>
          </div>
        </div>

        {/* Resumes List */}
        <div className="bg-[#111111] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#27272a]">
            <h2 className="text-lg font-semibold text-white">Your Resumes</h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#a1a1aa]">Loading your resumes...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-[#27272a] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No resumes yet
              </h3>
              <p className="text-[#a1a1aa] mb-6">
                Create your first professional resume in minutes
              </p>
              <Button variant="primary" onClick={handleNewResume}>
                <Plus className="w-4 h-4" />
                Create Resume
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-[#27272a]">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[#a1a1aa]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">
                        {resume.personalInfo?.fullName || 'Untitled Resume'}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-[#71717a]">
                        <span className="px-2 py-0.5 bg-[#27272a] rounded text-xs">
                          {getTemplateLabel(resume.templateStyle)}
                        </span>
                        <span>Updated {formatDate(resume.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/builder/${resume.id}`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/preview/${resume.id}`)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
