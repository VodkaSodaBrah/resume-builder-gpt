import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import type { ResumeData, TemplateStyle } from '@/types';

// ATS-Friendly Fonts (safe for all systems)
const FONTS = {
  classic: { heading: 'Times New Roman', body: 'Times New Roman' },
  modern: { heading: 'Arial', body: 'Arial' },
  professional: { heading: 'Calibri', body: 'Calibri' },
};

// Colors for each template
const COLORS = {
  classic: { primary: '000000', accent: '333333', muted: '666666' },
  modern: { primary: '1a1a1a', accent: '2563eb', muted: '6b7280' },
  professional: { primary: '111827', accent: '059669', muted: '4b5563' },
};

// Section titles
const SECTION_TITLES = {
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  volunteering: 'Volunteer Experience',
  references: 'References',
};

// Format date helper
const formatDate = (date: string | undefined, isCurrently?: boolean): string => {
  if (isCurrently) return 'Present';
  if (!date) return '';
  return date;
};

// Generate DOCX Resume
export const generateDOCX = async (data: ResumeData): Promise<Blob> => {
  const style = data.templateStyle || 'classic';
  const colors = COLORS[style];
  const fonts = FONTS[style];

  const children: Paragraph[] = [];

  // Header - Name
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.personalInfo.fullName,
          bold: true,
          size: style === 'classic' ? 32 : 28,
          font: fonts.heading,
          color: colors.primary,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  // Contact Info
  const contactParts = [
    data.personalInfo.email,
    data.personalInfo.phone,
    data.personalInfo.city,
  ].filter(Boolean);

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: contactParts.join(' | '),
          size: 20,
          font: fonts.body,
          color: colors.muted,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  // Section helper
  const addSectionHeader = (title: string) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 24,
            font: fonts.heading,
            color: colors.accent,
          }),
        ],
        spacing: { before: 300, after: 100 },
        border: {
          bottom: {
            color: colors.accent,
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
      })
    );
  };

  // Work Experience
  if (data.workExperience && data.workExperience.length > 0) {
    addSectionHeader(SECTION_TITLES.experience);

    for (const job of data.workExperience) {
      // Job title and company
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: job.jobTitle,
              bold: true,
              size: 22,
              font: fonts.body,
              color: colors.primary,
            }),
            new TextRun({
              text: ` | ${job.companyName}`,
              size: 22,
              font: fonts.body,
              color: colors.primary,
            }),
          ],
          spacing: { before: 150 },
        })
      );

      // Dates and location
      const dateRange = `${formatDate(job.startDate)} - ${formatDate(job.endDate, job.isCurrentJob)}`;
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${dateRange} | ${job.location}`,
              italics: true,
              size: 20,
              font: fonts.body,
              color: colors.muted,
            }),
          ],
          spacing: { after: 50 },
        })
      );

      // Responsibilities (use enhanced if available)
      const responsibilities = job.enhancedResponsibilities || job.responsibilities;
      const bulletPoints = responsibilities.split('\n').filter((line) => line.trim());

      for (const point of bulletPoints) {
        const cleanPoint = point.replace(/^[-•*]\s*/, '').trim();
        if (cleanPoint) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${cleanPoint}`,
                  size: 20,
                  font: fonts.body,
                  color: colors.primary,
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 50 },
            })
          );
        }
      }
    }
  }

  // Education
  if (data.education && data.education.length > 0) {
    addSectionHeader(SECTION_TITLES.education);

    for (const edu of data.education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree,
              bold: true,
              size: 22,
              font: fonts.body,
              color: colors.primary,
            }),
            edu.fieldOfStudy
              ? new TextRun({
                  text: ` in ${edu.fieldOfStudy}`,
                  size: 22,
                  font: fonts.body,
                  color: colors.primary,
                })
              : new TextRun({ text: '' }),
          ],
          spacing: { before: 150 },
        })
      );

      const yearRange = `${edu.startYear} - ${edu.isCurrentlyStudying ? 'Present' : edu.endYear}`;
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${edu.schoolName} | ${yearRange}`,
              italics: true,
              size: 20,
              font: fonts.body,
              color: colors.muted,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }
  }

  // Skills
  if (data.skills) {
    addSectionHeader(SECTION_TITLES.skills);

    const skillLines: string[] = [];

    if (data.skills.technicalSkills?.length > 0) {
      skillLines.push(`Technical: ${data.skills.technicalSkills.join(', ')}`);
    }
    if (data.skills.softSkills?.length > 0) {
      skillLines.push(`Soft Skills: ${data.skills.softSkills.join(', ')}`);
    }
    if (data.skills.certifications?.length > 0) {
      skillLines.push(`Certifications: ${data.skills.certifications.join(', ')}`);
    }
    if (data.skills.languages?.length > 0) {
      const langStr = data.skills.languages
        .map((l) => `${l.language} (${l.proficiency})`)
        .join(', ');
      skillLines.push(`Languages: ${langStr}`);
    }

    for (const line of skillLines) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${line}`,
              size: 20,
              font: fonts.body,
              color: colors.primary,
            }),
          ],
          indent: { left: 360 },
          spacing: { after: 50 },
        })
      );
    }
  }

  // Volunteering
  if (data.volunteering && data.volunteering.length > 0) {
    addSectionHeader(SECTION_TITLES.volunteering);

    for (const vol of data.volunteering) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: vol.role,
              bold: true,
              size: 22,
              font: fonts.body,
              color: colors.primary,
            }),
            new TextRun({
              text: ` | ${vol.organizationName}`,
              size: 22,
              font: fonts.body,
              color: colors.primary,
            }),
          ],
          spacing: { before: 150 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: vol.startDate,
              italics: true,
              size: 20,
              font: fonts.body,
              color: colors.muted,
            }),
          ],
          spacing: { after: 50 },
        })
      );

      if (vol.responsibilities) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: vol.responsibilities,
                size: 20,
                font: fonts.body,
                color: colors.primary,
              }),
            ],
            indent: { left: 360 },
            spacing: { after: 100 },
          })
        );
      }
    }
  }

  // References
  if (data.references && data.references.length > 0) {
    addSectionHeader(SECTION_TITLES.references);

    for (const ref of data.references) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: ref.name,
              bold: true,
              size: 20,
              font: fonts.body,
              color: colors.primary,
            }),
            new TextRun({
              text: ` - ${ref.jobTitle}, ${ref.company}`,
              size: 20,
              font: fonts.body,
              color: colors.primary,
            }),
          ],
          spacing: { before: 100 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${ref.phone} | ${ref.email} | ${ref.relationship}`,
              size: 20,
              font: fonts.body,
              color: colors.muted,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
};

// Generate PDF Resume
export const generatePDF = async (data: ResumeData): Promise<Blob> => {
  const style = data.templateStyle || 'classic';
  const colors = COLORS[style];
  const fonts = FONTS[style];

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper to add text
  const addText = (
    text: string,
    size: number,
    options: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      align?: 'left' | 'center' | 'right';
    } = {}
  ) => {
    const fontStyle = options.bold
      ? options.italic
        ? 'bolditalic'
        : 'bold'
      : options.italic
      ? 'italic'
      : 'normal';

    pdf.setFont(fonts.body === 'Times New Roman' ? 'times' : 'helvetica', fontStyle);
    pdf.setFontSize(size);

    const hexColor = options.color || colors.primary;
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);
    pdf.setTextColor(r, g, b);

    const x =
      options.align === 'center'
        ? pageWidth / 2
        : options.align === 'right'
        ? pageWidth - margin
        : margin;

    pdf.text(text, x, y, { align: options.align || 'left' });
  };

  const addLine = () => {
    pdf.setDrawColor(
      parseInt(colors.accent.substring(0, 2), 16),
      parseInt(colors.accent.substring(2, 4), 16),
      parseInt(colors.accent.substring(4, 6), 16)
    );
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;
  };

  // Check if we need a new page
  const checkNewPage = (needed: number) => {
    if (y + needed > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  // Header - Name
  addText(data.personalInfo.fullName, 24, { bold: true, align: 'center' });
  y += 30;

  // Contact Info
  const contactParts = [
    data.personalInfo.email,
    data.personalInfo.phone,
    data.personalInfo.city,
  ].filter(Boolean);
  addText(contactParts.join(' | '), 10, { align: 'center', color: colors.muted });
  y += 30;

  // Section helper
  const addSectionHeader = (title: string) => {
    checkNewPage(40);
    y += 15;
    addText(title.toUpperCase(), 12, { bold: true, color: colors.accent });
    y += 5;
    addLine();
    y += 5;
  };

  // Work Experience
  if (data.workExperience && data.workExperience.length > 0) {
    addSectionHeader(SECTION_TITLES.experience);

    for (const job of data.workExperience) {
      checkNewPage(60);

      addText(`${job.jobTitle} | ${job.companyName}`, 11, { bold: true });
      y += 15;

      const dateRange = `${formatDate(job.startDate)} - ${formatDate(job.endDate, job.isCurrentJob)}`;
      addText(`${dateRange} | ${job.location}`, 10, { italic: true, color: colors.muted });
      y += 15;

      const responsibilities = job.enhancedResponsibilities || job.responsibilities;
      const bulletPoints = responsibilities.split('\n').filter((line) => line.trim());

      for (const point of bulletPoints) {
        const cleanPoint = point.replace(/^[-•*]\s*/, '').trim();
        if (cleanPoint) {
          checkNewPage(15);
          const lines = pdf.splitTextToSize(`• ${cleanPoint}`, contentWidth - 20);
          pdf.text(lines, margin + 10, y);
          y += lines.length * 12;
        }
      }
      y += 10;
    }
  }

  // Education
  if (data.education && data.education.length > 0) {
    addSectionHeader(SECTION_TITLES.education);

    for (const edu of data.education) {
      checkNewPage(40);

      const degreeText = edu.fieldOfStudy
        ? `${edu.degree} in ${edu.fieldOfStudy}`
        : edu.degree;
      addText(degreeText, 11, { bold: true });
      y += 15;

      const yearRange = `${edu.startYear} - ${edu.isCurrentlyStudying ? 'Present' : edu.endYear}`;
      addText(`${edu.schoolName} | ${yearRange}`, 10, { italic: true, color: colors.muted });
      y += 20;
    }
  }

  // Skills
  if (data.skills) {
    addSectionHeader(SECTION_TITLES.skills);

    const skillLines: string[] = [];

    if (data.skills.technicalSkills?.length > 0) {
      skillLines.push(`Technical: ${data.skills.technicalSkills.join(', ')}`);
    }
    if (data.skills.softSkills?.length > 0) {
      skillLines.push(`Soft Skills: ${data.skills.softSkills.join(', ')}`);
    }
    if (data.skills.certifications?.length > 0) {
      skillLines.push(`Certifications: ${data.skills.certifications.join(', ')}`);
    }
    if (data.skills.languages?.length > 0) {
      const langStr = data.skills.languages
        .map((l) => `${l.language} (${l.proficiency})`)
        .join(', ');
      skillLines.push(`Languages: ${langStr}`);
    }

    for (const line of skillLines) {
      checkNewPage(15);
      const lines = pdf.splitTextToSize(`• ${line}`, contentWidth - 20);
      pdf.text(lines, margin + 10, y);
      y += lines.length * 12;
    }
  }

  return pdf.output('blob');
};

// Download functions
export const downloadDOCX = async (data: ResumeData, filename?: string): Promise<void> => {
  const blob = await generateDOCX(data);
  const name = filename || `${data.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.docx`;
  saveAs(blob, name);
};

export const downloadPDF = async (data: ResumeData, filename?: string): Promise<void> => {
  const blob = await generatePDF(data);
  const name = filename || `${data.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`;
  saveAs(blob, name);
};
