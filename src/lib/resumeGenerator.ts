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
  TabStopPosition,
  TabStopType,
  convertInchesToTwip,
} from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import type { ResumeData, TemplateStyle } from '@/types';

// ============================================================================
// TEMPLATE CONFIGURATION
// ============================================================================

// ATS-Friendly Fonts (safe for all systems)
const FONTS = {
  classic: { heading: 'Times New Roman', body: 'Times New Roman' },
  modern: { heading: 'Arial', body: 'Arial' },
  professional: { heading: 'Calibri', body: 'Calibri' },
};

// Colors for each template
const COLORS = {
  classic: { primary: '000000', accent: '333333', muted: '666666', line: '000000' },
  modern: { primary: '1a1a1a', accent: '1a1a1a', muted: '6b7280', line: '1a1a1a' },
  professional: { primary: '111827', accent: '111827', muted: '4b5563', line: '111827' },
};

// Layout spacing configurations with distinct visual styles
const LAYOUT_CONFIG = {
  classic: {
    // Typography
    nameSize: 28,
    sectionHeaderSize: 14,
    bodySize: 11,
    // Layout structure
    layoutType: 'single-column' as const,
    headerStyle: 'centered' as const,
    sectionDivider: 'full-underline' as const,
    // Spacing (generous for elegance)
    sectionSpacing: 450,
    itemSpacing: 220,
    headerAlignment: 'center' as const,
    dateAlignment: 'right' as const,
    sectionHeaderStyle: 'underline' as const,
    // Margins (in twips for DOCX, 720 twips = 0.5 inch)
    margins: { top: 720, right: 720, bottom: 720, left: 720 },
  },
  modern: {
    // Typography
    nameSize: 24,
    sectionHeaderSize: 12,
    bodySize: 10,
    // Layout structure - TWO-COLUMN SIDEBAR
    layoutType: 'sidebar' as const,
    headerStyle: 'full-width-accent' as const,
    sectionDivider: 'accent-bar' as const,
    // Sidebar configuration
    sidebarWidthPercent: 32, // percentage of page width
    sidebarBackground: 'f0f4f8', // light gray-blue
    sidebarSections: ['contact', 'skills', 'languages', 'certifications'] as const,
    mainSections: ['experience', 'education', 'volunteering', 'references'] as const,
    // Spacing (tighter for modern feel)
    sectionSpacing: 280,
    itemSpacing: 140,
    headerAlignment: 'left' as const,
    dateAlignment: 'left' as const,
    sectionHeaderStyle: 'accent-bar' as const,
    // Margins (tighter)
    margins: { top: 500, right: 500, bottom: 500, left: 500 },
  },
  professional: {
    // Typography
    nameSize: 22,
    sectionHeaderSize: 11,
    bodySize: 10,
    // Layout structure - SPLIT HEADER + COMPACT SECTIONS
    layoutType: 'compact-split' as const,
    headerStyle: 'split' as const,
    sectionDivider: 'thin-line' as const,
    // Two-column sections for compact display
    twoColumnSections: ['skills', 'education'] as const,
    // Spacing (ultra-compact for information density)
    sectionSpacing: 180,
    itemSpacing: 90,
    headerAlignment: 'left' as const,
    dateAlignment: 'inline' as const,
    sectionHeaderStyle: 'caps-minimal' as const,
    // Margins (minimal for max content)
    margins: { top: 450, right: 450, bottom: 450, left: 450 },
  },
};

// Section titles
const SECTION_TITLES = {
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  volunteering: 'Volunteer Experience',
  references: 'References',
};

// ============================================================================
// DEGREE ABBREVIATION EXPANSION
// ============================================================================

const DEGREE_ABBREVIATIONS: Record<string, string> = {
  // Bachelor's degrees
  'bs': 'Bachelor of Science',
  'b.s.': 'Bachelor of Science',
  'b.s': 'Bachelor of Science',
  'bsc': 'Bachelor of Science',
  'b.sc.': 'Bachelor of Science',
  'ba': 'Bachelor of Arts',
  'b.a.': 'Bachelor of Arts',
  'b.a': 'Bachelor of Arts',
  'be': 'Bachelor of Engineering',
  'b.e.': 'Bachelor of Engineering',
  'beng': 'Bachelor of Engineering',
  'bba': 'Bachelor of Business Administration',
  'b.b.a.': 'Bachelor of Business Administration',
  'bfa': 'Bachelor of Fine Arts',
  'b.f.a.': 'Bachelor of Fine Arts',
  'bsn': 'Bachelor of Science in Nursing',
  'b.s.n.': 'Bachelor of Science in Nursing',

  // Master's degrees
  'ms': 'Master of Science',
  'm.s.': 'Master of Science',
  'm.s': 'Master of Science',
  'msc': 'Master of Science',
  'm.sc.': 'Master of Science',
  'ma': 'Master of Arts',
  'm.a.': 'Master of Arts',
  'm.a': 'Master of Arts',
  'mba': 'Master of Business Administration',
  'm.b.a.': 'Master of Business Administration',
  'me': 'Master of Engineering',
  'm.e.': 'Master of Engineering',
  'meng': 'Master of Engineering',
  'med': 'Master of Education',
  'm.ed.': 'Master of Education',
  'mfa': 'Master of Fine Arts',
  'm.f.a.': 'Master of Fine Arts',
  'msn': 'Master of Science in Nursing',
  'm.s.n.': 'Master of Science in Nursing',
  'mph': 'Master of Public Health',
  'm.p.h.': 'Master of Public Health',
  'msw': 'Master of Social Work',
  'm.s.w.': 'Master of Social Work',

  // Doctoral degrees
  'phd': 'Doctor of Philosophy',
  'ph.d.': 'Doctor of Philosophy',
  'ph.d': 'Doctor of Philosophy',
  'md': 'Doctor of Medicine',
  'm.d.': 'Doctor of Medicine',
  'jd': 'Juris Doctor',
  'j.d.': 'Juris Doctor',
  'edd': 'Doctor of Education',
  'ed.d.': 'Doctor of Education',
  'dds': 'Doctor of Dental Surgery',
  'd.d.s.': 'Doctor of Dental Surgery',
  'dmd': 'Doctor of Dental Medicine',
  'd.m.d.': 'Doctor of Dental Medicine',
  'do': 'Doctor of Osteopathic Medicine',
  'd.o.': 'Doctor of Osteopathic Medicine',
  'pharmd': 'Doctor of Pharmacy',
  'pharm.d.': 'Doctor of Pharmacy',
  'dvm': 'Doctor of Veterinary Medicine',
  'd.v.m.': 'Doctor of Veterinary Medicine',

  // Associate degrees
  'aa': 'Associate of Arts',
  'a.a.': 'Associate of Arts',
  'as': 'Associate of Science',
  'a.s.': 'Associate of Science',
  'aas': 'Associate of Applied Science',
  'a.a.s.': 'Associate of Applied Science',
  'aes': 'Associate of Engineering Science',
  'a.e.s.': 'Associate of Engineering Science',
};

/**
 * Expands common degree abbreviations to their full names.
 * Exported for use in Preview component and testing.
 */
export const expandDegreeAbbreviation = (degree: string): string => {
  if (!degree) return degree;

  const trimmed = degree.trim();
  const lowerDegree = trimmed.toLowerCase();

  // Check for exact match first
  if (DEGREE_ABBREVIATIONS[lowerDegree]) {
    return DEGREE_ABBREVIATIONS[lowerDegree];
  }

  // Check for "abbreviation in field" pattern (e.g., "BS in Computer Science")
  // Skip if "field" is purely numeric (likely a year like "BS in 2010")
  const inPattern = /^([a-z.]+)\s+in\s+(.+)$/i;
  const inMatch = trimmed.match(inPattern);
  if (inMatch) {
    const abbrev = inMatch[1].toLowerCase().replace(/\s/g, '');
    const field = inMatch[2];
    // Don't expand if field is purely numeric (e.g., "2010") - that's a year, not a field of study
    const isPurelyNumeric = /^\d+$/.test(field.trim());
    if (DEGREE_ABBREVIATIONS[abbrev] && !isPurelyNumeric) {
      return `${DEGREE_ABBREVIATIONS[abbrev]} in ${field}`;
    }
  }

  // Check for "abbreviation of field" pattern
  const ofPattern = /^([a-z.]+)\s+of\s+(.+)$/i;
  const ofMatch = trimmed.match(ofPattern);
  if (ofMatch) {
    const abbrev = ofMatch[1].toLowerCase().replace(/\s/g, '');
    const field = ofMatch[2];
    if (DEGREE_ABBREVIATIONS[abbrev]) {
      return `${DEGREE_ABBREVIATIONS[abbrev]} in ${field}`;
    }
  }

  // Check if the degree starts with a known abbreviation
  for (const [abbrev, fullName] of Object.entries(DEGREE_ABBREVIATIONS)) {
    const escapedAbbrev = abbrev.replace(/\./g, '\\.');
    const startPattern = new RegExp(`^${escapedAbbrev}\\s+`, 'i');
    if (startPattern.test(trimmed)) {
      return trimmed.replace(startPattern, `${fullName} `);
    }
  }

  return trimmed;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDate = (date: string | undefined, isCurrently?: boolean): string => {
  if (isCurrently) return 'Present';
  if (!date) return '';
  return date;
};

const getSkillLines = (skills: ResumeData['skills']): string[] => {
  const skillLines: string[] = [];
  if (skills?.technicalSkills?.length > 0) {
    skillLines.push(`Technical: ${skills.technicalSkills.join(', ')}`);
  }
  if (skills?.softSkills?.length > 0) {
    skillLines.push(`Soft Skills: ${skills.softSkills.join(', ')}`);
  }
  if (skills?.certifications?.length > 0) {
    skillLines.push(`Certifications: ${skills.certifications.join(', ')}`);
  }
  if (skills?.languages?.length > 0) {
    const langStr = skills.languages.map((l) => `${l.language} (${l.proficiency})`).join(', ');
    skillLines.push(`Languages: ${langStr}`);
  }
  return skillLines;
};

// ============================================================================
// DOCX GENERATOR - CLASSIC TEMPLATE
// ============================================================================

const generateClassicDOCX = async (data: ResumeData): Promise<Paragraph[]> => {
  const colors = COLORS.classic;
  const fonts = FONTS.classic;
  const layout = LAYOUT_CONFIG.classic;
  const children: Paragraph[] = [];

  // =========================================================================
  // CLASSIC TEMPLATE: Traditional Executive Style
  // - Centered header with elegant serif typography
  // - Full-width horizontal rules under section headers
  // - Right-aligned dates in italics
  // - Generous margins for breathing room
  // =========================================================================

  // Header - Centered name with large elegant serif font
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.personalInfo.fullName,
          bold: true,
          size: layout.nameSize * 2, // docx uses half-points (28pt = 56 half-points)
          font: fonts.heading,
          color: colors.primary,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    })
  );

  // Decorative line under name
  children.push(
    new Paragraph({
      children: [],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      border: {
        bottom: {
          color: colors.line,
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6, // thin elegant line
        },
      },
    })
  );

  // Contact Info - Centered with elegant spacing
  const contactParts = [data.personalInfo.email, data.personalInfo.phone, data.personalInfo.city].filter(Boolean);
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: contactParts.join('    |    '),
          size: 22,
          font: fonts.body,
          color: colors.muted,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: layout.sectionSpacing },
    })
  );

  // Section header helper - Classic style with full-width underline
  const addSectionHeader = (title: string) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: layout.sectionHeaderSize * 2,
            font: fonts.heading,
            color: colors.primary,
            characterSpacing: 40, // letter-spacing for elegance
          }),
        ],
        spacing: { before: layout.sectionSpacing, after: 100 },
        border: {
          bottom: {
            color: colors.line,
            space: 2,
            style: BorderStyle.SINGLE,
            size: 12, // prominent underline
          },
        },
      })
    );
  };

  // Work Experience with right-aligned italicized dates
  if (data.workExperience?.length > 0) {
    addSectionHeader(SECTION_TITLES.experience);

    for (const job of data.workExperience) {
      const dateRange = `${formatDate(job.startDate)} - ${formatDate(job.endDate, job.isCurrentJob)}`;

      // Job title and company - bold, with right-aligned italicized date
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: job.jobTitle,
              bold: true,
              size: 24, // slightly larger for hierarchy
              font: fonts.body,
              color: colors.primary,
            }),
            new TextRun({
              text: '\t',
            }),
            new TextRun({
              text: dateRange,
              italics: true, // italicized dates for classic elegance
              size: 22,
              font: fonts.body,
              color: colors.muted,
            }),
          ],
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          spacing: { before: layout.itemSpacing },
        })
      );

      // Company name and location on second line
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: job.companyName,
              bold: true,
              size: 22,
              font: fonts.body,
              color: colors.accent,
            }),
            new TextRun({
              text: `  -  ${job.location}`,
              italics: true,
              size: 22,
              font: fonts.body,
              color: colors.muted,
            }),
          ],
          spacing: { after: 80 },
        })
      );

      // Responsibilities with elegant bullet points
      const responsibilities = job.enhancedResponsibilities || job.responsibilities;
      const bulletPoints = responsibilities.split('\n').filter((line) => line.trim());

      for (const point of bulletPoints) {
        const cleanPoint = point.replace(/^[-•*]\s*/, '').trim();
        if (cleanPoint) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: cleanPoint,
                  size: 22,
                  font: fonts.body,
                  color: colors.primary,
                }),
              ],
              bullet: { level: 0 }, // proper bullet formatting
              indent: { left: 360 },
              spacing: { after: 60 },
            })
          );
        }
      }
    }
  }

  // Education with elegant formatting
  if (data.education?.length > 0) {
    addSectionHeader(SECTION_TITLES.education);

    for (const edu of data.education) {
      const expandedDegree = expandDegreeAbbreviation(edu.degree);
      const yearRange = `${edu.startYear} - ${edu.isCurrentlyStudying ? 'Present' : (edu.endYear || 'Present')}`;
      const degreeText = edu.fieldOfStudy ? `${expandedDegree} in ${edu.fieldOfStudy}` : expandedDegree;

      // Degree with right-aligned italicized years
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: degreeText,
              bold: true,
              size: 24,
              font: fonts.body,
              color: colors.primary,
            }),
            new TextRun({ text: '\t' }),
            new TextRun({
              text: yearRange,
              italics: true,
              size: 22,
              font: fonts.body,
              color: colors.muted,
            }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          spacing: { before: layout.itemSpacing },
        })
      );

      // Institution name
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.schoolName,
              italics: true,
              size: 22,
              font: fonts.body,
              color: colors.accent,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }
  }

  // Skills - elegant category display
  const classicSkillLines = getSkillLines(data.skills);
  if (classicSkillLines.length > 0) {
    addSectionHeader(SECTION_TITLES.skills);

    for (const line of classicSkillLines) {
      // Split category from content (e.g., "Technical: JavaScript, React")
      const colonIndex = line.indexOf(':');
      if (colonIndex > -1) {
        const category = line.substring(0, colonIndex + 1);
        const skills = line.substring(colonIndex + 1).trim();
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: category,
                bold: true,
                size: 22,
                font: fonts.body,
                color: colors.accent,
              }),
              new TextRun({
                text: ` ${skills}`,
                size: 22,
                font: fonts.body,
                color: colors.primary,
              }),
            ],
            indent: { left: 360 },
            spacing: { after: 80 },
          })
        );
      } else {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 22,
                font: fonts.body,
                color: colors.primary,
              }),
            ],
            bullet: { level: 0 },
            indent: { left: 360 },
            spacing: { after: 80 },
          })
        );
      }
    }
  }

  // Volunteering with elegant formatting
  if (data.volunteering?.length > 0) {
    addSectionHeader(SECTION_TITLES.volunteering);

    for (const vol of data.volunteering) {
      const volDateRange = vol.endDate
        ? `${vol.startDate} - ${vol.endDate}`
        : `${vol.startDate} - Present`;

      // Role with right-aligned date
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: vol.role,
              bold: true,
              size: 24,
              font: fonts.body,
              color: colors.primary,
            }),
            new TextRun({ text: '\t' }),
            new TextRun({
              text: volDateRange,
              italics: true,
              size: 22,
              font: fonts.body,
              color: colors.muted,
            }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          spacing: { before: layout.itemSpacing },
        })
      );

      // Organization name
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: vol.organizationName,
              italics: true,
              size: 22,
              font: fonts.body,
              color: colors.accent,
            }),
          ],
          spacing: { after: 60 },
        })
      );

      if (vol.responsibilities) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: vol.responsibilities,
                size: 22,
                font: fonts.body,
                color: colors.primary,
              }),
            ],
            bullet: { level: 0 },
            indent: { left: 360 },
            spacing: { after: 80 },
          })
        );
      }
    }
  }

  // References with elegant formatting
  if (data.references?.length > 0) {
    addSectionHeader(SECTION_TITLES.references);

    for (const ref of data.references) {
      // Name with title
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: ref.name,
              bold: true,
              size: 24,
              font: fonts.body,
              color: colors.primary,
            }),
          ],
          spacing: { before: layout.itemSpacing },
        })
      );

      // Title and company
      const refTitle = [ref.jobTitle, ref.company].filter(Boolean).join(', ');
      if (refTitle) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: refTitle,
                italics: true,
                size: 22,
                font: fonts.body,
                color: colors.accent,
              }),
            ],
          })
        );
      }

      // Contact info
      const refContactParts = [ref.phone, ref.email].filter(Boolean);
      if (refContactParts.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: refContactParts.join('    |    '),
                size: 22,
                font: fonts.body,
                color: colors.muted,
              }),
            ],
            spacing: { after: 80 },
          })
        );
      }

      // Relationship
      if (ref.relationship) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Relationship: ${ref.relationship}`,
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
  }

  return children;
};

// ============================================================================
// DOCX GENERATOR - MODERN TEMPLATE (Two-Column Layout)
// ============================================================================

const generateModernDOCX = async (data: ResumeData): Promise<(Paragraph | Table)[]> => {
  const colors = COLORS.modern;
  const fonts = FONTS.modern;
  const layout = LAYOUT_CONFIG.modern;
  const children: (Paragraph | Table)[] = [];

  // =========================================================================
  // MODERN TEMPLATE: Tech Sidebar Layout
  // - Full-width header at top
  // - Two-column layout: sidebar (32%) + main content (68%)
  // - Sidebar: Contact, Skills, Languages, Certifications (gray background)
  // - Main: Experience, Education, Volunteering, References
  // =========================================================================

  // Full-width Header - Name with bold accent bar
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.personalInfo.fullName,
          bold: true,
          size: layout.nameSize * 2,
          font: fonts.heading,
          color: colors.primary,
        }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 60 },
    })
  );

  // Accent bar under name
  children.push(
    new Paragraph({
      children: [],
      spacing: { after: 200 },
      border: {
        bottom: {
          color: colors.accent,
          space: 1,
          style: BorderStyle.SINGLE,
          size: 36, // thick accent bar
        },
      },
    })
  );

  // =========================================================================
  // Build SIDEBAR content (left column)
  // =========================================================================
  const sidebarParagraphs: Paragraph[] = [];

  // Sidebar section header helper
  const createSidebarHeader = (title: string): Paragraph => {
    return new Paragraph({
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 20,
          font: fonts.heading,
          color: colors.accent,
        }),
      ],
      spacing: { before: 200, after: 100 },
      border: {
        bottom: {
          color: colors.accent,
          space: 2,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
    });
  };

  // Contact section in sidebar
  sidebarParagraphs.push(createSidebarHeader('Contact'));

  if (data.personalInfo.email) {
    sidebarParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: data.personalInfo.email, size: 18, font: fonts.body, color: colors.primary }),
        ],
        spacing: { after: 60 },
      })
    );
  }

  if (data.personalInfo.phone) {
    sidebarParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: data.personalInfo.phone, size: 18, font: fonts.body, color: colors.primary }),
        ],
        spacing: { after: 60 },
      })
    );
  }

  if (data.personalInfo.city) {
    sidebarParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: data.personalInfo.city, size: 18, font: fonts.body, color: colors.primary }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  // Skills section in sidebar
  const hasSkills = data.skills && (
    (data.skills.technicalSkills?.length ?? 0) > 0 ||
    (data.skills.softSkills?.length ?? 0) > 0
  );

  if (hasSkills) {
    sidebarParagraphs.push(createSidebarHeader('Skills'));

    if (data.skills.technicalSkills?.length > 0) {
      sidebarParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Technical', bold: true, size: 18, font: fonts.body, color: colors.accent }),
          ],
          spacing: { after: 40 },
        })
      );
      for (const skill of data.skills.technicalSkills) {
        sidebarParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `• ${skill}`, size: 17, font: fonts.body, color: colors.primary }),
            ],
            spacing: { after: 30 },
          })
        );
      }
    }

    if (data.skills.softSkills?.length > 0) {
      sidebarParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Soft Skills', bold: true, size: 18, font: fonts.body, color: colors.accent }),
          ],
          spacing: { before: 80, after: 40 },
        })
      );
      for (const skill of data.skills.softSkills) {
        sidebarParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `• ${skill}`, size: 17, font: fonts.body, color: colors.primary }),
            ],
            spacing: { after: 30 },
          })
        );
      }
    }
  }

  // Languages in sidebar
  if (data.skills?.languages?.length > 0) {
    sidebarParagraphs.push(createSidebarHeader('Languages'));
    for (const lang of data.skills.languages) {
      sidebarParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: lang.language, bold: true, size: 17, font: fonts.body, color: colors.primary }),
            new TextRun({ text: ` - ${lang.proficiency}`, size: 17, font: fonts.body, color: colors.muted }),
          ],
          spacing: { after: 40 },
        })
      );
    }
  }

  // Certifications in sidebar
  if (data.skills?.certifications?.length > 0) {
    sidebarParagraphs.push(createSidebarHeader('Certifications'));
    for (const cert of data.skills.certifications) {
      sidebarParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `• ${cert}`, size: 17, font: fonts.body, color: colors.primary }),
          ],
          spacing: { after: 40 },
        })
      );
    }
  }

  // =========================================================================
  // Build MAIN content (right column)
  // =========================================================================
  const mainParagraphs: Paragraph[] = [];

  // Main section header helper
  const createMainHeader = (title: string): Paragraph => {
    return new Paragraph({
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: layout.sectionHeaderSize * 2,
          font: fonts.heading,
          color: colors.accent,
        }),
      ],
      spacing: { before: 100, after: 120 },
      border: {
        bottom: {
          color: colors.accent,
          space: 2,
          style: BorderStyle.SINGLE,
          size: 8,
        },
      },
    });
  };

  // Work Experience in main column
  if (data.workExperience?.length > 0) {
    mainParagraphs.push(createMainHeader(SECTION_TITLES.experience));

    for (const job of data.workExperience) {
      const dateRange = `${formatDate(job.startDate)} - ${formatDate(job.endDate, job.isCurrentJob)}`;

      // Job title
      mainParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: job.jobTitle, bold: true, size: 22, font: fonts.body, color: colors.primary }),
          ],
          spacing: { before: layout.itemSpacing },
        })
      );

      // Company, location, dates
      mainParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${job.companyName}  •  ${job.location}  •  ${dateRange}`,
              size: 18,
              font: fonts.body,
              color: colors.muted,
            }),
          ],
          spacing: { after: 80 },
        })
      );

      // Responsibilities
      const responsibilities = job.enhancedResponsibilities || job.responsibilities;
      const bulletPoints = responsibilities.split('\n').filter((line) => line.trim());

      for (const point of bulletPoints) {
        const cleanPoint = point.replace(/^[-•*]\s*/, '').trim();
        if (cleanPoint) {
          mainParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: cleanPoint, size: 18, font: fonts.body, color: colors.primary }),
              ],
              bullet: { level: 0 },
              indent: { left: 200 },
              spacing: { after: 40 },
            })
          );
        }
      }
    }
  }

  // Education in main column
  if (data.education?.length > 0) {
    mainParagraphs.push(createMainHeader(SECTION_TITLES.education));

    for (const edu of data.education) {
      const expandedDegree = expandDegreeAbbreviation(edu.degree);
      const degreeText = edu.fieldOfStudy ? `${expandedDegree} in ${edu.fieldOfStudy}` : expandedDegree;
      const yearRange = `${edu.startYear} - ${edu.isCurrentlyStudying ? 'Present' : (edu.endYear || 'Present')}`;

      mainParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: degreeText, bold: true, size: 20, font: fonts.body, color: colors.primary }),
          ],
          spacing: { before: layout.itemSpacing },
        })
      );

      mainParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${edu.schoolName}  •  ${yearRange}`,
              size: 18,
              font: fonts.body,
              color: colors.muted,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }
  }

  // Volunteering in main column
  if (data.volunteering?.length > 0) {
    mainParagraphs.push(createMainHeader(SECTION_TITLES.volunteering));

    for (const vol of data.volunteering) {
      const volDateRange = vol.endDate ? `${vol.startDate} - ${vol.endDate}` : `${vol.startDate} - Present`;

      mainParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: vol.role, bold: true, size: 20, font: fonts.body, color: colors.primary }),
          ],
          spacing: { before: layout.itemSpacing },
        })
      );

      mainParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${vol.organizationName}  •  ${volDateRange}`,
              size: 18,
              font: fonts.body,
              color: colors.muted,
            }),
          ],
          spacing: { after: 60 },
        })
      );

      if (vol.responsibilities) {
        mainParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: vol.responsibilities, size: 18, font: fonts.body, color: colors.primary }),
            ],
            bullet: { level: 0 },
            indent: { left: 200 },
            spacing: { after: 60 },
          })
        );
      }
    }
  }

  // References in main column
  if (data.references?.length > 0) {
    mainParagraphs.push(createMainHeader(SECTION_TITLES.references));

    for (const ref of data.references) {
      const refTitle = [ref.jobTitle, ref.company].filter(Boolean).join(', ');

      mainParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: ref.name, bold: true, size: 18, font: fonts.body, color: colors.primary }),
            ...(refTitle ? [new TextRun({ text: ` - ${refTitle}`, size: 18, font: fonts.body, color: colors.muted })] : []),
          ],
          spacing: { before: layout.itemSpacing },
        })
      );

      const refContact = [ref.phone, ref.email, ref.relationship].filter(Boolean);
      if (refContact.length > 0) {
        mainParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: refContact.join('  •  '), size: 17, font: fonts.body, color: colors.muted }),
            ],
            spacing: { after: 80 },
          })
        );
      }
    }
  }

  // =========================================================================
  // Create the two-column table layout
  // =========================================================================
  const twoColumnTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    columnWidths: [convertInchesToTwip(2.2), convertInchesToTwip(4.8)], // ~32% / ~68%
    rows: [
      new TableRow({
        children: [
          // Sidebar cell (left) with gray background
          new TableCell({
            shading: { fill: layout.sidebarBackground, type: ShadingType.SOLID },
            margins: {
              top: convertInchesToTwip(0.15),
              bottom: convertInchesToTwip(0.15),
              left: convertInchesToTwip(0.15),
              right: convertInchesToTwip(0.15),
            },
            children: sidebarParagraphs.length > 0 ? sidebarParagraphs : [new Paragraph({ children: [] })],
          }),
          // Main content cell (right)
          new TableCell({
            margins: {
              top: convertInchesToTwip(0.1),
              bottom: convertInchesToTwip(0.1),
              left: convertInchesToTwip(0.2),
              right: convertInchesToTwip(0.1),
            },
            children: mainParagraphs.length > 0 ? mainParagraphs : [new Paragraph({ children: [] })],
          }),
        ],
      }),
    ],
  });

  children.push(twoColumnTable);

  return children;
};

// ============================================================================
// DOCX GENERATOR - PROFESSIONAL TEMPLATE (Compact Layout)
// ============================================================================

const generateProfessionalDOCX = async (data: ResumeData): Promise<(Paragraph | Table)[]> => {
  const colors = COLORS.professional;
  const fonts = FONTS.professional;
  const layout = LAYOUT_CONFIG.professional;
  const children: (Paragraph | Table)[] = [];

  // =========================================================================
  // PROFESSIONAL TEMPLATE: Executive Compact Style
  // - Split header: Name left, contact right
  // - Two-column sections for Skills + Education
  // - Ultra-compact formatting for maximum information density
  // - Inline dates with pipe separators
  // =========================================================================

  // Split Header Table: Name (left) | Contact (right)
  const contactParts = [data.personalInfo.email, data.personalInfo.phone, data.personalInfo.city].filter(Boolean);

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          // Name cell (left)
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: data.personalInfo.fullName.toUpperCase(),
                    bold: true,
                    size: layout.nameSize * 2,
                    font: fonts.heading,
                    color: colors.primary,
                  }),
                ],
                alignment: AlignmentType.LEFT,
              }),
            ],
          }),
          // Contact cell (right)
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: data.personalInfo.email || '',
                    size: 18,
                    font: fonts.body,
                    color: colors.muted,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: data.personalInfo.phone || '',
                    size: 18,
                    font: fonts.body,
                    color: colors.muted,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: data.personalInfo.city || '',
                    size: 18,
                    font: fonts.body,
                    color: colors.muted,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  children.push(headerTable);

  // Separator line
  children.push(
    new Paragraph({
      children: [],
      spacing: { before: 100, after: 150 },
      border: {
        bottom: {
          color: colors.accent,
          space: 2,
          style: BorderStyle.DOUBLE,
          size: 6,
        },
      },
    })
  );

  // Section header helper - Ultra minimal
  const addSectionHeader = (title: string) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: layout.sectionHeaderSize * 2,
            font: fonts.heading,
            color: colors.accent,
            characterSpacing: 30,
          }),
        ],
        spacing: { before: layout.sectionSpacing, after: 80 },
        border: {
          bottom: {
            color: colors.line,
            space: 1,
            style: BorderStyle.SINGLE,
            size: 4,
          },
        },
      })
    );
  };

  // =========================================================================
  // TWO-COLUMN SECTION: Skills (left) | Education (right)
  // =========================================================================
  const hasSkillsContent = data.skills && (
    (data.skills.technicalSkills?.length ?? 0) > 0 ||
    (data.skills.softSkills?.length ?? 0) > 0 ||
    (data.skills.certifications?.length ?? 0) > 0 ||
    (data.skills.languages?.length ?? 0) > 0
  );
  const hasEducation = data.education?.length > 0;

  if (hasSkillsContent || hasEducation) {
    // Build Skills column content
    const skillsParagraphs: Paragraph[] = [];

    if (hasSkillsContent) {
      skillsParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'SKILLS',
              bold: true,
              size: 20,
              font: fonts.heading,
              color: colors.accent,
            }),
          ],
          spacing: { after: 80 },
          border: {
            bottom: { color: colors.line, space: 1, style: BorderStyle.SINGLE, size: 4 },
          },
        })
      );

      if (data.skills.technicalSkills?.length > 0) {
        skillsParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Technical: ', bold: true, size: 17, font: fonts.body, color: colors.accent }),
              new TextRun({ text: data.skills.technicalSkills.join(', '), size: 17, font: fonts.body, color: colors.primary }),
            ],
            spacing: { after: 50 },
          })
        );
      }

      if (data.skills.softSkills?.length > 0) {
        skillsParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Soft: ', bold: true, size: 17, font: fonts.body, color: colors.accent }),
              new TextRun({ text: data.skills.softSkills.join(', '), size: 17, font: fonts.body, color: colors.primary }),
            ],
            spacing: { after: 50 },
          })
        );
      }

      if (data.skills.certifications?.length > 0) {
        skillsParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Certs: ', bold: true, size: 17, font: fonts.body, color: colors.accent }),
              new TextRun({ text: data.skills.certifications.join(', '), size: 17, font: fonts.body, color: colors.primary }),
            ],
            spacing: { after: 50 },
          })
        );
      }

      if (data.skills.languages?.length > 0) {
        const langStr = data.skills.languages.map((l) => `${l.language} (${l.proficiency})`).join(', ');
        skillsParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Languages: ', bold: true, size: 17, font: fonts.body, color: colors.accent }),
              new TextRun({ text: langStr, size: 17, font: fonts.body, color: colors.primary }),
            ],
            spacing: { after: 50 },
          })
        );
      }
    }

    // Build Education column content
    const educationParagraphs: Paragraph[] = [];

    if (hasEducation) {
      educationParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'EDUCATION',
              bold: true,
              size: 20,
              font: fonts.heading,
              color: colors.accent,
            }),
          ],
          spacing: { after: 80 },
          border: {
            bottom: { color: colors.line, space: 1, style: BorderStyle.SINGLE, size: 4 },
          },
        })
      );

      for (const edu of data.education) {
        const expandedDegree = expandDegreeAbbreviation(edu.degree);
        const degreeText = edu.fieldOfStudy ? `${expandedDegree} in ${edu.fieldOfStudy}` : expandedDegree;
        const yearRange = `${edu.startYear} - ${edu.isCurrentlyStudying ? 'Present' : (edu.endYear || 'Present')}`;

        educationParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: degreeText, bold: true, size: 17, font: fonts.body, color: colors.primary }),
            ],
            spacing: { after: 30 },
          })
        );

        educationParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${edu.schoolName} | ${yearRange}`, size: 16, font: fonts.body, color: colors.muted }),
            ],
            spacing: { after: 60 },
          })
        );
      }
    }

    // Create two-column table for Skills | Education
    const twoColumnTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      columnWidths: [convertInchesToTwip(3.3), convertInchesToTwip(3.5)],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              margins: { right: convertInchesToTwip(0.15) },
              children: skillsParagraphs.length > 0 ? skillsParagraphs : [new Paragraph({ children: [] })],
            }),
            new TableCell({
              margins: { left: convertInchesToTwip(0.15) },
              children: educationParagraphs.length > 0 ? educationParagraphs : [new Paragraph({ children: [] })],
            }),
          ],
        }),
      ],
    });

    children.push(
      new Paragraph({
        children: [],
        spacing: { before: 150 },
      })
    );
    children.push(twoColumnTable);
  }

  // =========================================================================
  // FULL-WIDTH: Work Experience (main section)
  // =========================================================================
  if (data.workExperience?.length > 0) {
    addSectionHeader(SECTION_TITLES.experience);

    for (const job of data.workExperience) {
      const dateRange = `${formatDate(job.startDate)} - ${formatDate(job.endDate, job.isCurrentJob)}`;

      // Job title with inline metadata
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: job.jobTitle,
              bold: true,
              size: 20,
              font: fonts.body,
              color: colors.primary,
            }),
            new TextRun({
              text: ` | ${job.companyName} | ${job.location} | ${dateRange}`,
              size: 18,
              font: fonts.body,
              color: colors.muted,
            }),
          ],
          spacing: { before: layout.itemSpacing, after: 50 },
        })
      );

      // Responsibilities - Compact bullets
      const responsibilities = job.enhancedResponsibilities || job.responsibilities;
      const bulletPoints = responsibilities.split('\n').filter((line) => line.trim());

      for (const point of bulletPoints) {
        const cleanPoint = point.replace(/^[-•*]\s*/, '').trim();
        if (cleanPoint) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: cleanPoint, size: 18, font: fonts.body, color: colors.primary }),
              ],
              bullet: { level: 0 },
              indent: { left: 200 },
              spacing: { after: 30 },
            })
          );
        }
      }
    }
  }

  // =========================================================================
  // FULL-WIDTH: Volunteering
  // =========================================================================
  if (data.volunteering?.length > 0) {
    addSectionHeader(SECTION_TITLES.volunteering);

    for (const vol of data.volunteering) {
      const volDateRange = vol.endDate ? `${vol.startDate} - ${vol.endDate}` : `${vol.startDate} - Present`;

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: vol.role, bold: true, size: 18, font: fonts.body, color: colors.primary }),
            new TextRun({ text: ` | ${vol.organizationName} | ${volDateRange}`, size: 17, font: fonts.body, color: colors.muted }),
          ],
          spacing: { before: layout.itemSpacing, after: 30 },
        })
      );

      if (vol.responsibilities) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: vol.responsibilities, size: 17, font: fonts.body, color: colors.primary }),
            ],
            bullet: { level: 0 },
            indent: { left: 200 },
            spacing: { after: 30 },
          })
        );
      }
    }
  }

  // =========================================================================
  // FULL-WIDTH: References
  // =========================================================================
  if (data.references?.length > 0) {
    addSectionHeader(SECTION_TITLES.references);

    for (const ref of data.references) {
      const refParts = [
        [ref.jobTitle, ref.company].filter(Boolean).join(', '),
        ref.phone,
        ref.email
      ].filter(Boolean);
      const refSuffix = refParts.length > 0 ? ` | ${refParts.join(' | ')}` : '';

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: ref.name, bold: true, size: 18, font: fonts.body, color: colors.primary }),
            new TextRun({ text: refSuffix, size: 17, font: fonts.body, color: colors.muted }),
          ],
          spacing: { before: layout.itemSpacing, after: 50 },
        })
      );
    }
  }

  return children;
};

// ============================================================================
// MAIN DOCX GENERATOR
// ============================================================================

export const generateDOCX = async (data: ResumeData): Promise<Blob> => {
  const style = data.templateStyle || 'classic';

  let children: (Paragraph | Table)[];
  const config = LAYOUT_CONFIG[style] || LAYOUT_CONFIG.classic;
  const margins = config.margins;

  switch (style) {
    case 'modern':
      children = await generateModernDOCX(data);
      break;
    case 'professional':
      children = await generateProfessionalDOCX(data);
      break;
    case 'classic':
    default:
      children = await generateClassicDOCX(data);
      break;
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: margins,
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
};

// ============================================================================
// PDF GENERATOR - CLASSIC TEMPLATE
// ============================================================================

const generateClassicPDF = async (data: ResumeData, pdf: jsPDF): Promise<void> => {
  const layout = LAYOUT_CONFIG.classic;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 55; // generous margins for elegance
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // =========================================================================
  // CLASSIC PDF TEMPLATE: Traditional Executive Style
  // - Centered header with elegant serif typography
  // - Full-width horizontal rules under section headers
  // - Right-aligned italicized dates
  // - Generous margins for breathing room
  // =========================================================================

  const checkNewPage = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  // Header - Centered name with large serif font
  pdf.setFont('times', 'bold');
  pdf.setFontSize(layout.nameSize);
  pdf.setTextColor(0, 0, 0);
  pdf.text(data.personalInfo.fullName, pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Decorative line under name
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  const lineWidth = 200;
  pdf.line((pageWidth - lineWidth) / 2, y, (pageWidth + lineWidth) / 2, y);
  y += 20;

  // Contact - Centered with elegant spacing
  const contactParts = [data.personalInfo.email, data.personalInfo.phone, data.personalInfo.city].filter(Boolean);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(102, 102, 102);
  pdf.text(contactParts.join('    |    '), pageWidth / 2, y, { align: 'center' });
  y += 35;

  // Section header helper - full-width underline
  const addSectionHeader = (title: string) => {
    checkNewPage(45);
    y += 18;
    pdf.setFont('times', 'bold');
    pdf.setFontSize(layout.sectionHeaderSize);
    pdf.setTextColor(0, 0, 0);
    // Letter-spaced uppercase header
    const spacedTitle = title.toUpperCase().split('').join(' ');
    pdf.text(spacedTitle, margin, y);
    y += 6;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 18;
  };

  // Work Experience with right-aligned italicized dates
  if (data.workExperience?.length > 0) {
    addSectionHeader(SECTION_TITLES.experience);

    for (const job of data.workExperience) {
      checkNewPage(65);

      const dateRange = `${formatDate(job.startDate)} - ${formatDate(job.endDate, job.isCurrentJob)}`;

      // Job title (bold) with right-aligned italicized date
      pdf.setFont('times', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(job.jobTitle, margin, y);

      pdf.setFont('times', 'italic');
      pdf.setFontSize(11);
      pdf.setTextColor(102, 102, 102);
      pdf.text(dateRange, pageWidth - margin, y, { align: 'right' });
      y += 16;

      // Company name (bold) and location (italic)
      pdf.setFont('times', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(51, 51, 51);
      const companyText = job.companyName;
      pdf.text(companyText, margin, y);

      pdf.setFont('times', 'italic');
      pdf.setTextColor(102, 102, 102);
      pdf.text(`  -  ${job.location}`, margin + pdf.getTextWidth(companyText), y);
      y += 14;

      // Responsibilities with proper bullet points
      pdf.setFont('times', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      const responsibilities = job.enhancedResponsibilities || job.responsibilities;
      const bulletPoints = responsibilities.split('\n').filter((line) => line.trim());

      for (const point of bulletPoints) {
        const cleanPoint = point.replace(/^[-•*]\s*/, '').trim();
        if (cleanPoint) {
          checkNewPage(16);
          pdf.text('\u2022', margin + 10, y); // bullet character
          const lines = pdf.splitTextToSize(cleanPoint, contentWidth - 30);
          pdf.text(lines, margin + 22, y);
          y += lines.length * 13;
        }
      }
      y += 10;
    }
  }

  // Education with elegant formatting
  if (data.education?.length > 0) {
    addSectionHeader(SECTION_TITLES.education);

    for (const edu of data.education) {
      checkNewPage(40);

      const expandedDegree = expandDegreeAbbreviation(edu.degree);
      const degreeText = edu.fieldOfStudy ? `${expandedDegree} in ${edu.fieldOfStudy}` : expandedDegree;
      const yearRange = `${edu.startYear} - ${edu.isCurrentlyStudying ? 'Present' : (edu.endYear || 'Present')}`;

      // Degree (bold) with right-aligned italicized years
      pdf.setFont('times', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(degreeText, margin, y);

      pdf.setFont('times', 'italic');
      pdf.setFontSize(11);
      pdf.setTextColor(102, 102, 102);
      pdf.text(yearRange, pageWidth - margin, y, { align: 'right' });
      y += 16;

      // Institution name (italic, accent color)
      pdf.setFont('times', 'italic');
      pdf.setFontSize(11);
      pdf.setTextColor(51, 51, 51);
      pdf.text(edu.schoolName, margin, y);
      y += 20;
    }
  }

  // Skills - elegant category display
  const classicPdfSkillLines = getSkillLines(data.skills);
  if (classicPdfSkillLines.length > 0) {
    addSectionHeader(SECTION_TITLES.skills);

    for (const line of classicPdfSkillLines) {
      checkNewPage(18);

      // Split category from content
      const colonIndex = line.indexOf(':');
      if (colonIndex > -1) {
        const category = line.substring(0, colonIndex + 1);
        const skills = line.substring(colonIndex + 1).trim();

        pdf.setFont('times', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(51, 51, 51);
        pdf.text(category, margin + 15, y);

        pdf.setFont('times', 'normal');
        pdf.setTextColor(0, 0, 0);
        const categoryWidth = pdf.getTextWidth(category + ' ');
        const skillLines = pdf.splitTextToSize(skills, contentWidth - categoryWidth - 20);
        pdf.text(skillLines, margin + 15 + categoryWidth, y);
        y += skillLines.length * 14;
      } else {
        pdf.setFont('times', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.text('\u2022', margin + 10, y);
        const lines = pdf.splitTextToSize(line, contentWidth - 30);
        pdf.text(lines, margin + 22, y);
        y += lines.length * 14;
      }
    }
  }

  // Volunteering with elegant formatting
  if (data.volunteering?.length > 0) {
    addSectionHeader(SECTION_TITLES.volunteering);

    for (const vol of data.volunteering) {
      checkNewPage(40);

      const classicPdfVolDate = vol.endDate
        ? `${vol.startDate} - ${vol.endDate}`
        : `${vol.startDate} - Present`;

      // Role (bold) with right-aligned italicized date
      pdf.setFont('times', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(vol.role, margin, y);

      pdf.setFont('times', 'italic');
      pdf.setFontSize(11);
      pdf.setTextColor(102, 102, 102);
      pdf.text(classicPdfVolDate, pageWidth - margin, y, { align: 'right' });
      y += 16;

      // Organization name (italic)
      pdf.setFont('times', 'italic');
      pdf.setFontSize(11);
      pdf.setTextColor(51, 51, 51);
      pdf.text(vol.organizationName, margin, y);
      y += 14;

      if (vol.responsibilities) {
        pdf.setFont('times', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text('\u2022', margin + 10, y);
        const lines = pdf.splitTextToSize(vol.responsibilities, contentWidth - 30);
        pdf.text(lines, margin + 22, y);
        y += lines.length * 13;
      }
      y += 10;
    }
  }

  // References with elegant formatting
  if (data.references?.length > 0) {
    addSectionHeader(SECTION_TITLES.references);

    for (const ref of data.references) {
      checkNewPage(45);

      // Name (bold)
      pdf.setFont('times', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(ref.name, margin, y);
      y += 14;

      // Title and company (italic)
      const classicPdfRefTitle = [ref.jobTitle, ref.company].filter(Boolean).join(', ');
      if (classicPdfRefTitle) {
        pdf.setFont('times', 'italic');
        pdf.setFontSize(11);
        pdf.setTextColor(51, 51, 51);
        pdf.text(classicPdfRefTitle, margin, y);
        y += 13;
      }

      // Contact info
      const classicPdfRefContact = [ref.phone, ref.email].filter(Boolean);
      if (classicPdfRefContact.length > 0) {
        pdf.setFont('times', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(102, 102, 102);
        pdf.text(classicPdfRefContact.join('    |    '), margin, y);
        y += 13;
      }

      // Relationship
      if (ref.relationship) {
        pdf.setFont('times', 'italic');
        pdf.setFontSize(10);
        pdf.setTextColor(102, 102, 102);
        pdf.text(`Relationship: ${ref.relationship}`, margin, y);
        y += 13;
      }
      y += 8;
    }
  }
};

// ============================================================================
// PDF GENERATOR - MODERN TEMPLATE
// ============================================================================

const generateModernPDF = async (data: ResumeData, pdf: jsPDF): Promise<void> => {
  const layout = LAYOUT_CONFIG.modern;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 35;

  // =========================================================================
  // MODERN PDF TEMPLATE: Tech Sidebar Layout
  // - Full-width header at top
  // - Two-column layout: sidebar (32%) + main content (68%)
  // - Sidebar has light gray background
  // =========================================================================

  // Color definitions
  const accentRGB = { r: 26, g: 26, b: 26 }; // black/dark gray
  const mutedRGB = { r: 107, g: 114, b: 128 };
  const sidebarBgRGB = { r: 240, g: 244, b: 248 }; // light gray-blue #f0f4f8

  // Layout dimensions
  const sidebarWidth = pageWidth * 0.32;
  const mainWidth = pageWidth - sidebarWidth - margin - 15; // 15pt gap
  const sidebarX = 0;
  const mainX = sidebarWidth + 15;

  // =========================================================================
  // SIDEBAR BACKGROUND (full height from top)
  // =========================================================================
  pdf.setFillColor(sidebarBgRGB.r, sidebarBgRGB.g, sidebarBgRGB.b);
  pdf.rect(0, 0, sidebarWidth, pageHeight, 'F');

  // =========================================================================
  // HEADER (name on sidebar background)
  // =========================================================================
  let y = 50;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(layout.nameSize);
  pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
  pdf.text(data.personalInfo.fullName, 15, y);
  y += 8;

  // Accent bar under name (full width)
  pdf.setDrawColor(accentRGB.r, accentRGB.g, accentRGB.b);
  pdf.setLineWidth(2);
  pdf.line(15, y, pageWidth - margin, y);
  y += 20;

  const columnStartY = y;

  // =========================================================================
  // SIDEBAR CONTENT
  // =========================================================================
  let sidebarY = columnStartY;
  const sidebarPadding = 15;
  const sidebarContentX = sidebarPadding;
  const sidebarContentWidth = sidebarWidth - sidebarPadding * 2;

  // Sidebar section header helper
  const addSidebarHeader = (title: string) => {
    sidebarY += 15;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.text(title.toUpperCase(), sidebarContentX, sidebarY);
    sidebarY += 4;
    pdf.setDrawColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.setLineWidth(0.5);
    pdf.line(sidebarContentX, sidebarY, sidebarContentX + sidebarContentWidth, sidebarY);
    sidebarY += 12;
  };

  // Contact section
  addSidebarHeader('Contact');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);

  if (data.personalInfo.email) {
    pdf.text(data.personalInfo.email, sidebarContentX, sidebarY);
    sidebarY += 12;
  }
  if (data.personalInfo.phone) {
    pdf.text(data.personalInfo.phone, sidebarContentX, sidebarY);
    sidebarY += 12;
  }
  if (data.personalInfo.city) {
    pdf.text(data.personalInfo.city, sidebarContentX, sidebarY);
    sidebarY += 12;
  }

  // Skills section
  const hasSkills = data.skills && (
    (data.skills.technicalSkills?.length ?? 0) > 0 ||
    (data.skills.softSkills?.length ?? 0) > 0
  );

  if (hasSkills) {
    addSidebarHeader('Skills');

    if (data.skills.technicalSkills?.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Technical', sidebarContentX, sidebarY);
      sidebarY += 11;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      for (const skill of data.skills.technicalSkills) {
        const lines = pdf.splitTextToSize(`• ${skill}`, sidebarContentWidth);
        pdf.text(lines, sidebarContentX, sidebarY);
        sidebarY += lines.length * 10;
      }
      sidebarY += 5;
    }

    if (data.skills.softSkills?.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Soft Skills', sidebarContentX, sidebarY);
      sidebarY += 11;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      for (const skill of data.skills.softSkills) {
        const lines = pdf.splitTextToSize(`• ${skill}`, sidebarContentWidth);
        pdf.text(lines, sidebarContentX, sidebarY);
        sidebarY += lines.length * 10;
      }
      sidebarY += 5;
    }
  }

  // Languages section
  if (data.skills?.languages?.length > 0) {
    addSidebarHeader('Languages');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    for (const lang of data.skills.languages) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(lang.language, sidebarContentX, sidebarY);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(mutedRGB.r, mutedRGB.g, mutedRGB.b);
      pdf.text(` - ${lang.proficiency}`, sidebarContentX + pdf.getTextWidth(lang.language), sidebarY);
      pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
      sidebarY += 11;
    }
  }

  // Certifications section
  if (data.skills?.certifications?.length > 0) {
    addSidebarHeader('Certifications');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    for (const cert of data.skills.certifications) {
      const lines = pdf.splitTextToSize(`• ${cert}`, sidebarContentWidth);
      pdf.text(lines, sidebarContentX, sidebarY);
      sidebarY += lines.length * 10;
    }
  }

  // =========================================================================
  // MAIN CONTENT
  // =========================================================================
  let mainY = columnStartY;

  // Main section header helper
  const addMainHeader = (title: string) => {
    // Check for page break
    if (mainY + 40 > pageHeight - margin) {
      pdf.addPage();
      mainY = margin;
      // Redraw sidebar background on new page
      pdf.setFillColor(sidebarBgRGB.r, sidebarBgRGB.g, sidebarBgRGB.b);
      pdf.rect(sidebarX, margin - 5, sidebarWidth, pageHeight - margin * 2 + 5, 'F');
    }

    mainY += 12;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(layout.sectionHeaderSize);
    pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.text(title.toUpperCase(), mainX, mainY);
    mainY += 4;
    pdf.setDrawColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.setLineWidth(1);
    pdf.line(mainX, mainY, mainX + 100, mainY);
    mainY += 14;
  };

  // Check for page break in main content
  const checkMainNewPage = (needed: number) => {
    if (mainY + needed > pageHeight - margin) {
      pdf.addPage();
      mainY = margin;
      // Redraw sidebar background on new page
      pdf.setFillColor(sidebarBgRGB.r, sidebarBgRGB.g, sidebarBgRGB.b);
      pdf.rect(sidebarX, margin - 5, sidebarWidth, pageHeight - margin * 2 + 5, 'F');
    }
  };

  // Work Experience
  if (data.workExperience?.length > 0) {
    addMainHeader(SECTION_TITLES.experience);

    for (const job of data.workExperience) {
      checkMainNewPage(55);

      const dateRange = `${formatDate(job.startDate)} - ${formatDate(job.endDate, job.isCurrentJob)}`;

      // Job title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
      pdf.text(job.jobTitle, mainX, mainY);
      mainY += 13;

      // Company, location, dates
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(mutedRGB.r, mutedRGB.g, mutedRGB.b);
      pdf.text(`${job.companyName}  •  ${job.location}  •  ${dateRange}`, mainX, mainY);
      mainY += 12;

      // Responsibilities
      pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
      pdf.setFontSize(9);
      const responsibilities = job.enhancedResponsibilities || job.responsibilities;
      const bulletPoints = responsibilities.split('\n').filter((line) => line.trim());

      for (const point of bulletPoints) {
        const cleanPoint = point.replace(/^[-•*]\s*/, '').trim();
        if (cleanPoint) {
          checkMainNewPage(14);
          pdf.text('\u2022', mainX + 5, mainY);
          const lines = pdf.splitTextToSize(cleanPoint, mainWidth - 20);
          pdf.text(lines, mainX + 15, mainY);
          mainY += lines.length * 11;
        }
      }
      mainY += 8;
    }
  }

  // Education
  if (data.education?.length > 0) {
    addMainHeader(SECTION_TITLES.education);

    for (const edu of data.education) {
      checkMainNewPage(30);

      const expandedDegree = expandDegreeAbbreviation(edu.degree);
      const degreeText = edu.fieldOfStudy ? `${expandedDegree} in ${edu.fieldOfStudy}` : expandedDegree;
      const yearRange = `${edu.startYear} - ${edu.isCurrentlyStudying ? 'Present' : (edu.endYear || 'Present')}`;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
      pdf.text(degreeText, mainX, mainY);
      mainY += 12;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(mutedRGB.r, mutedRGB.g, mutedRGB.b);
      pdf.text(`${edu.schoolName}  •  ${yearRange}`, mainX, mainY);
      mainY += 15;
    }
  }

  // Volunteering
  if (data.volunteering?.length > 0) {
    addMainHeader(SECTION_TITLES.volunteering);

    for (const vol of data.volunteering) {
      checkMainNewPage(30);

      const volDateRange = vol.endDate ? `${vol.startDate} - ${vol.endDate}` : `${vol.startDate} - Present`;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
      pdf.text(vol.role, mainX, mainY);
      mainY += 12;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(mutedRGB.r, mutedRGB.g, mutedRGB.b);
      pdf.text(`${vol.organizationName}  •  ${volDateRange}`, mainX, mainY);
      mainY += 11;

      if (vol.responsibilities) {
        pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
        pdf.text('\u2022', mainX + 5, mainY);
        const lines = pdf.splitTextToSize(vol.responsibilities, mainWidth - 20);
        pdf.text(lines, mainX + 15, mainY);
        mainY += lines.length * 11;
      }
      mainY += 6;
    }
  }

  // References
  if (data.references?.length > 0) {
    addMainHeader(SECTION_TITLES.references);

    for (const ref of data.references) {
      checkMainNewPage(25);

      const refTitle = [ref.jobTitle, ref.company].filter(Boolean).join(', ');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
      pdf.text(ref.name, mainX, mainY);

      if (refTitle) {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(mutedRGB.r, mutedRGB.g, mutedRGB.b);
        pdf.text(` - ${refTitle}`, mainX + pdf.getTextWidth(ref.name), mainY);
      }
      mainY += 11;

      const refContact = [ref.phone, ref.email, ref.relationship].filter(Boolean);
      if (refContact.length > 0) {
        pdf.setTextColor(mutedRGB.r, mutedRGB.g, mutedRGB.b);
        pdf.text(refContact.join('  •  '), mainX, mainY);
        mainY += 14;
      }
    }
  }
};

// ============================================================================
// PDF GENERATOR - PROFESSIONAL TEMPLATE
// ============================================================================

const generateProfessionalPDF = async (data: ResumeData, pdf: jsPDF): Promise<void> => {
  const layout = LAYOUT_CONFIG.professional;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 38;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // =========================================================================
  // PROFESSIONAL PDF TEMPLATE: Executive Compact Style
  // - Split header: Name left, contact right
  // - Two-column sections for Skills + Education
  // - Ultra-compact formatting for maximum information density
  // =========================================================================

  // Color definitions
  const accentRGB = { r: 17, g: 24, b: 39 }; // dark gray
  const mutedRGB = { r: 75, g: 85, b: 99 };

  const checkNewPage = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  // =========================================================================
  // SPLIT HEADER: Name (left) | Contact (right)
  // =========================================================================
  // Name on left
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(layout.nameSize);
  pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
  pdf.text(data.personalInfo.fullName.toUpperCase(), margin, y);

  // Contact stack on right
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(mutedRGB.r, mutedRGB.g, mutedRGB.b);

  let contactY = y - 5;
  if (data.personalInfo.email) {
    pdf.text(data.personalInfo.email, pageWidth - margin, contactY, { align: 'right' });
    contactY += 10;
  }
  if (data.personalInfo.phone) {
    pdf.text(data.personalInfo.phone, pageWidth - margin, contactY, { align: 'right' });
    contactY += 10;
  }
  if (data.personalInfo.city) {
    pdf.text(data.personalInfo.city, pageWidth - margin, contactY, { align: 'right' });
  }

  y += 18;

  // Double line separator
  pdf.setDrawColor(accentRGB.r, accentRGB.g, accentRGB.b);
  pdf.setLineWidth(1.5);
  pdf.line(margin, y, pageWidth - margin, y);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y + 3, pageWidth - margin, y + 3);
  y += 20;

  // =========================================================================
  // TWO-COLUMN SECTION: Skills (left) | Education (right)
  // =========================================================================
  const hasSkillsContent = data.skills && (
    (data.skills.technicalSkills?.length ?? 0) > 0 ||
    (data.skills.softSkills?.length ?? 0) > 0 ||
    (data.skills.certifications?.length ?? 0) > 0 ||
    (data.skills.languages?.length ?? 0) > 0
  );
  const hasEducation = data.education?.length > 0;

  if (hasSkillsContent || hasEducation) {
    const leftColX = margin;
    const rightColX = margin + contentWidth / 2 + 10;
    const colWidth = contentWidth / 2 - 10;
    const startY = y;

    // =========== LEFT COLUMN: SKILLS ===========
    let leftY = startY;

    if (hasSkillsContent) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
      pdf.text('SKILLS', leftColX, leftY);
      leftY += 4;
      pdf.setDrawColor(accentRGB.r, accentRGB.g, accentRGB.b);
      pdf.setLineWidth(0.5);
      pdf.line(leftColX, leftY, leftColX + colWidth * 0.6, leftY);
      leftY += 12;

      pdf.setFontSize(8);

      if (data.skills.technicalSkills?.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
        pdf.text('Technical: ', leftColX, leftY);
        pdf.setFont('helvetica', 'normal');
        const techLines = pdf.splitTextToSize(data.skills.technicalSkills.join(', '), colWidth - pdf.getTextWidth('Technical: ') - 5);
        pdf.text(techLines, leftColX + pdf.getTextWidth('Technical: '), leftY);
        leftY += techLines.length * 10 + 3;
      }

      if (data.skills.softSkills?.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Soft: ', leftColX, leftY);
        pdf.setFont('helvetica', 'normal');
        const softLines = pdf.splitTextToSize(data.skills.softSkills.join(', '), colWidth - pdf.getTextWidth('Soft: ') - 5);
        pdf.text(softLines, leftColX + pdf.getTextWidth('Soft: '), leftY);
        leftY += softLines.length * 10 + 3;
      }

      if (data.skills.certifications?.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Certs: ', leftColX, leftY);
        pdf.setFont('helvetica', 'normal');
        const certLines = pdf.splitTextToSize(data.skills.certifications.join(', '), colWidth - pdf.getTextWidth('Certs: ') - 5);
        pdf.text(certLines, leftColX + pdf.getTextWidth('Certs: '), leftY);
        leftY += certLines.length * 10 + 3;
      }

      if (data.skills.languages?.length > 0) {
        const langStr = data.skills.languages.map((l) => `${l.language} (${l.proficiency})`).join(', ');
        pdf.setFont('helvetica', 'bold');
        pdf.text('Languages: ', leftColX, leftY);
        pdf.setFont('helvetica', 'normal');
        const langLines = pdf.splitTextToSize(langStr, colWidth - pdf.getTextWidth('Languages: ') - 5);
        pdf.text(langLines, leftColX + pdf.getTextWidth('Languages: '), leftY);
        leftY += langLines.length * 10 + 3;
      }
    }

    // =========== RIGHT COLUMN: EDUCATION ===========
    let rightY = startY;

    if (hasEducation) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
      pdf.text('EDUCATION', rightColX, rightY);
      rightY += 4;
      pdf.setDrawColor(accentRGB.r, accentRGB.g, accentRGB.b);
      pdf.setLineWidth(0.5);
      pdf.line(rightColX, rightY, rightColX + colWidth * 0.6, rightY);
      rightY += 12;

      pdf.setFontSize(8);

      for (const edu of data.education) {
        const expandedDegree = expandDegreeAbbreviation(edu.degree);
        const degreeText = edu.fieldOfStudy ? `${expandedDegree} in ${edu.fieldOfStudy}` : expandedDegree;
        const yearRange = `${edu.startYear} - ${edu.isCurrentlyStudying ? 'Present' : (edu.endYear || 'Present')}`;

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
        const degreeLines = pdf.splitTextToSize(degreeText, colWidth);
        pdf.text(degreeLines, rightColX, rightY);
        rightY += degreeLines.length * 10;

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(mutedRGB.r, mutedRGB.g, mutedRGB.b);
        const schoolLines = pdf.splitTextToSize(`${edu.schoolName} | ${yearRange}`, colWidth);
        pdf.text(schoolLines, rightColX, rightY);
        rightY += schoolLines.length * 9 + 8;
      }
    }

    // Move y to the end of the taller column
    y = Math.max(leftY, rightY) + 10;
  }

  // =========================================================================
  // FULL-WIDTH: Work Experience
  // =========================================================================
  if (data.workExperience?.length > 0) {
    checkNewPage(30);
    y += 5;

    // Section header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.text('WORK EXPERIENCE', margin, y);
    y += 4;
    pdf.setDrawColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 12;

    for (const job of data.workExperience) {
      checkNewPage(45);

      const dateRange = `${formatDate(job.startDate)} - ${formatDate(job.endDate, job.isCurrentJob)}`;

      // Job title with inline metadata
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
      pdf.text(job.jobTitle, margin, y);

      const titleWidth = pdf.getTextWidth(job.jobTitle);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(mutedRGB.r, mutedRGB.g, mutedRGB.b);
      pdf.text(` | ${job.companyName} | ${job.location} | ${dateRange}`, margin + titleWidth, y);
      y += 12;

      // Responsibilities
      pdf.setFontSize(9);
      pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
      const responsibilities = job.enhancedResponsibilities || job.responsibilities;
      const bulletPoints = responsibilities.split('\n').filter((line) => line.trim());

      for (const point of bulletPoints) {
        const cleanPoint = point.replace(/^[-•*]\s*/, '').trim();
        if (cleanPoint) {
          checkNewPage(12);
          pdf.text('\u2022', margin + 5, y);
          const lines = pdf.splitTextToSize(cleanPoint, contentWidth - 20);
          pdf.text(lines, margin + 15, y);
          y += lines.length * 10;
        }
      }
      y += 6;
    }
  }

  // =========================================================================
  // FULL-WIDTH: Volunteering
  // =========================================================================
  if (data.volunteering?.length > 0) {
    checkNewPage(25);
    y += 5;

    // Section header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.text('VOLUNTEER EXPERIENCE', margin, y);
    y += 4;
    pdf.setDrawColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 12;

    for (const vol of data.volunteering) {
      checkNewPage(20);

      const volDateRange = vol.endDate ? `${vol.startDate} - ${vol.endDate}` : `${vol.startDate} - Present`;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
      pdf.text(vol.role, margin, y);

      const roleWidth = pdf.getTextWidth(vol.role);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(mutedRGB.r, mutedRGB.g, mutedRGB.b);
      pdf.text(` | ${vol.organizationName} | ${volDateRange}`, margin + roleWidth, y);
      y += 10;

      if (vol.responsibilities) {
        pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
        pdf.text('\u2022', margin + 5, y);
        const lines = pdf.splitTextToSize(vol.responsibilities, contentWidth - 20);
        pdf.text(lines, margin + 15, y);
        y += lines.length * 10;
      }
      y += 4;
    }
  }

  // =========================================================================
  // FULL-WIDTH: References
  // =========================================================================
  if (data.references?.length > 0) {
    checkNewPage(25);
    y += 5;

    // Section header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.text('REFERENCES', margin, y);
    y += 4;
    pdf.setDrawColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 12;

    for (const ref of data.references) {
      checkNewPage(15);

      const refParts = [
        [ref.jobTitle, ref.company].filter(Boolean).join(', '),
        ref.phone,
        ref.email
      ].filter(Boolean);
      const refSuffix = refParts.length > 0 ? ` | ${refParts.join(' | ')}` : '';

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
      pdf.text(ref.name, margin, y);

      if (refSuffix) {
        const nameWidth = pdf.getTextWidth(ref.name);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(mutedRGB.r, mutedRGB.g, mutedRGB.b);
        pdf.text(refSuffix, margin + nameWidth, y);
      }
      y += 12;
    }
  }
};

// ============================================================================
// MAIN PDF GENERATOR
// ============================================================================

export const generatePDF = async (data: ResumeData): Promise<Blob> => {
  const style = data.templateStyle || 'classic';

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  switch (style) {
    case 'modern':
      await generateModernPDF(data, pdf);
      break;
    case 'professional':
      await generateProfessionalPDF(data, pdf);
      break;
    case 'classic':
    default:
      await generateClassicPDF(data, pdf);
      break;
  }

  return pdf.output('blob');
};

// ============================================================================
// DOWNLOAD FUNCTIONS
// ============================================================================

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
