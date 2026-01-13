import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FileText,
  Edit,
  Download,
  Trash2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { UserButton } from '@/components/auth/UserButton';
import { useAuth } from '@/hooks/useAuth';
import { getResumes, deleteResume, Resume } from '@/lib/supabase';

export const Dashboard: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, isLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && user) {
      fetchResumes();
    }
  }, [isLoaded, user]);

  const fetchResumes = async () => {
    if (!user) return;

    try {
      setError(null);
      const data = await getResumes(user.id);
      setResumes(data);
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
      setError('Failed to load resumes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewResume = () => {
    navigate('/builder');
  };

  const handleDeleteResume = async (id: string) => {
    if (!user || !confirm('Are you sure you want to delete this resume?')) return;

    try {
      await deleteResume(id, user.id);
      setResumes(resumes.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete resume:', err);
      setError('Failed to delete resume. Please try again.');
    }
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

  const getResumeName = (resume: Resume) => {
    return resume.name || resume.resume_data?.personalInfo?.fullName || 'Untitled Resume';
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
              <span className="text-sm text-[#a1a1aa] hidden sm:inline">
                {user?.firstName || user?.emailAddresses?.[0]?.emailAddress}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome back, {user?.firstName || 'there'}!
          </h1>
          <p className="text-[#a1a1aa]">
            Manage your resumes and create new ones to land your dream job.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

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
                ? formatDate(resumes[0]?.updated_at)
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
                        {getResumeName(resume)}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-[#71717a]">
                        <span className="px-2 py-0.5 bg-[#27272a] rounded text-xs">
                          {getTemplateLabel(resume.resume_data?.templateStyle || 'classic')}
                        </span>
                        <span>Updated {formatDate(resume.updated_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/builder/${resume.id}`)}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/preview/${resume.id}`)}
                      title="Preview & Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteResume(resume.id)}
                      title="Delete"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
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
