import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FileCheck, Eye, Download } from 'lucide-react';
import type { ResumeData, TemplateStyle } from '@/types';
import { downloadPDF, downloadDOCX } from '@/lib/resumeGenerator';
import { useTranslation } from '@/hooks/useTranslation';
import { useAnalyticsStore, AnalyticsEvents } from '@/stores/analyticsStore';

interface ExportOptionsCardProps {
  resumeData: Partial<ResumeData>;
  onViewPreview?: () => void;
}

export const ExportOptionsCard: React.FC<ExportOptionsCardProps> = ({
  resumeData,
  onViewPreview,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { trackEvent } = useAnalyticsStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadType, setDownloadType] = useState<'pdf' | 'docx' | null>(null);

  const handleViewPreview = () => {
    if (onViewPreview) {
      onViewPreview();
    } else {
      navigate('/preview/new', { state: { resumeData } });
    }
  };

  const handleDownloadPDF = async () => {
    if (!resumeData) return;

    setIsDownloading(true);
    setDownloadType('pdf');
    trackEvent(AnalyticsEvents.DOWNLOAD_PDF);

    try {
      const templateStyle = (resumeData.templateStyle || 'modern') as TemplateStyle;
      const dataWithTemplate = { ...resumeData, templateStyle } as ResumeData;
      await downloadPDF(dataWithTemplate);
    } catch (error) {
      console.error('PDF download failed:', error);
    } finally {
      setIsDownloading(false);
      setDownloadType(null);
    }
  };

  const handleDownloadDOCX = async () => {
    if (!resumeData) return;

    setIsDownloading(true);
    setDownloadType('docx');
    trackEvent(AnalyticsEvents.DOWNLOAD_DOCX);

    try {
      const templateStyle = (resumeData.templateStyle || 'modern') as TemplateStyle;
      const dataWithTemplate = { ...resumeData, templateStyle } as ResumeData;
      await downloadDOCX(dataWithTemplate);
    } catch (error) {
      console.error('DOCX download failed:', error);
    } finally {
      setIsDownloading(false);
      setDownloadType(null);
    }
  };

  const personalInfo = (resumeData.personalInfo || {}) as { fullName?: string };

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111111] border border-[#27272a] rounded-xl p-5 max-w-md shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">
            {t('export.title', 'Your Resume is Ready!')}
          </h3>
          <p className="text-[#71717a] text-sm">
            {personalInfo.fullName ? `${personalInfo.fullName}'s Resume` : t('export.subtitle', 'Download or preview your resume')}
          </p>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="space-y-3 mb-4">
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading && downloadType === 'pdf' ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          {t('export.downloadPDF', 'Download PDF')}
        </button>

        <button
          onClick={handleDownloadDOCX}
          disabled={isDownloading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#27272a] text-white font-medium rounded-lg hover:bg-[#3f3f46] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-[#3f3f46]"
        >
          {isDownloading && downloadType === 'docx' ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileCheck className="w-4 h-4" />
          )}
          {t('export.downloadDOCX', 'Download Word (DOCX)')}
        </button>
      </div>

      {/* View Full Preview Link */}
      <button
        onClick={handleViewPreview}
        className="w-full flex items-center justify-center gap-2 py-2 text-[#a1a1aa] hover:text-white text-sm transition-colors"
      >
        <Eye className="w-4 h-4" />
        {t('export.viewPreview', 'View Full Preview & Edit')}
      </button>

      {/* Info text */}
      <p className="text-center text-[#52525b] text-xs mt-3">
        {t('export.atsNote', 'Both formats are ATS-friendly and optimized for job applications')}
      </p>
    </div>
  );
};
