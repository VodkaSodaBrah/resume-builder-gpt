/**
 * Template Test Script (Node.js compatible)
 * Generates DOCX and PDF files for all 3 templates to visually verify layouts
 *
 * Usage: node scripts/test-templates.mjs
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  convertInchesToTwip,
  HeadingLevel,
  TabStopType,
  TabStopPosition,
} from 'docx';
import { jsPDF } from 'jspdf';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

// Layout configurations for each template
const LAYOUT_CONFIG = {
  classic: {
    nameSize: 28,
    sectionHeaderSize: 14,
    bodySize: 11,
    layoutType: 'single-column',
    headerStyle: 'centered',
    sectionDivider: 'full-underline',
    sectionSpacing: 450,
    itemSpacing: 220,
    margins: { top: 720, right: 720, bottom: 720, left: 720 },
    font: 'Times New Roman',
    nameFont: 'Times New Roman',
    primaryColor: '000000',
    accentColor: '333333',
  },
  modern: {
    nameSize: 26,
    sectionHeaderSize: 12,
    bodySize: 10,
    layoutType: 'sidebar',
    sidebarWidthPercent: 32,
    sidebarBackground: 'f0f4f8',
    sidebarSections: ['contact', 'skills', 'languages', 'certifications'],
    mainSections: ['experience', 'education', 'volunteering', 'references'],
    margins: { top: 500, right: 500, bottom: 500, left: 500 },
    font: 'Arial',
    nameFont: 'Arial',
    primaryColor: '2563eb',
    accentColor: '1e40af',
  },
  professional: {
    nameSize: 24,
    sectionHeaderSize: 11,
    bodySize: 10,
    layoutType: 'compact-split',
    headerStyle: 'split',
    twoColumnSections: ['skills', 'education'],
    margins: { top: 450, right: 450, bottom: 450, left: 450 },
    font: 'Calibri',
    nameFont: 'Calibri',
    primaryColor: '1f2937',
    accentColor: '374151',
    lineSpacing: 1.0,
    compactMode: true,
  },
};

// Full test data
const fullResumeData = {
  personalInfo: {
    fullName: 'John Test Smith',
    email: 'john.test@example.com',
    phone: '(555) 123-4567',
    city: 'Austin, TX',
  },
  workExperience: [
    {
      id: 'work-1',
      jobTitle: 'Senior Software Engineer',
      companyName: 'Tech Innovation Corp',
      location: 'Austin, TX',
      startDate: 'January 2022',
      endDate: '',
      isCurrentJob: true,
      responsibilities: 'Led development of microservices architecture serving 10M+ users. Mentored team of 5 junior developers. Reduced deployment time by 60% through CI/CD improvements.',
    },
    {
      id: 'work-2',
      jobTitle: 'Software Developer',
      companyName: 'Digital Solutions LLC',
      location: 'San Francisco, CA',
      startDate: 'June 2019',
      endDate: 'December 2021',
      isCurrentJob: false,
      responsibilities: 'Built RESTful APIs using Node.js and Express. Developed React frontend applications.',
    },
  ],
  education: [
    {
      id: 'edu-1',
      schoolName: 'University of Texas at Austin',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      startYear: '2014',
      endYear: '2018',
    },
  ],
  skills: {
    technicalSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS'],
    softSkills: ['Leadership', 'Communication', 'Problem Solving'],
    certifications: ['AWS Certified Developer', 'Google Cloud Professional'],
    languages: [
      { language: 'English', proficiency: 'Native' },
      { language: 'Spanish', proficiency: 'Conversational' },
    ],
  },
  volunteering: [
    {
      id: 'vol-1',
      organizationName: 'Code for Good',
      role: 'Volunteer Developer',
      startDate: 'January 2020',
      endDate: 'December 2021',
      responsibilities: 'Built websites for local nonprofits.',
    },
  ],
  references: [
    {
      id: 'ref-1',
      name: 'Jane Manager',
      jobTitle: 'Engineering Director',
      company: 'Tech Innovation Corp',
      email: 'jane@tech.com',
      phone: '(555) 987-6543',
      relationship: 'Current Manager',
    },
  ],
};

// =============================================================================
// CLASSIC TEMPLATE - Single Column, Centered Header
// =============================================================================
function generateClassicDOCX(data) {
  const layout = LAYOUT_CONFIG.classic;
  const paragraphs = [];

  // Centered Name
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: data.personalInfo?.fullName || '',
          bold: true,
          size: layout.nameSize * 2,
          font: layout.nameFont,
        }),
      ],
    })
  );

  // Centered Contact
  const contactParts = [
    data.personalInfo?.email,
    data.personalInfo?.phone,
    data.personalInfo?.city,
  ].filter(Boolean);

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: layout.sectionSpacing },
      children: [
        new TextRun({
          text: contactParts.join(' | '),
          size: layout.bodySize * 2,
          font: layout.font,
          color: layout.accentColor,
        }),
      ],
    })
  );

  // Helper for section headers with underline
  const addSectionHeader = (title) => {
    paragraphs.push(
      new Paragraph({
        spacing: { before: layout.sectionSpacing, after: 80 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
        },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: layout.sectionHeaderSize * 2,
            font: layout.font,
          }),
        ],
      })
    );
  };

  // Work Experience
  if (data.workExperience?.length > 0) {
    addSectionHeader('Work Experience');
    data.workExperience.forEach((job) => {
      paragraphs.push(
        new Paragraph({
          spacing: { before: layout.itemSpacing },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: job.jobTitle || '', bold: true, size: layout.bodySize * 2, font: layout.font }),
            new TextRun({ text: ' | ', size: layout.bodySize * 2, font: layout.font }),
            new TextRun({ text: job.companyName || '', size: layout.bodySize * 2, font: layout.font }),
          ],
        })
      );
      const dateRange = job.isCurrentJob
        ? `${job.startDate} - Present`
        : `${job.startDate} - ${job.endDate}`;
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: dateRange, italics: true, size: layout.bodySize * 2, font: layout.font, color: layout.accentColor }),
            new TextRun({ text: ' | ', size: layout.bodySize * 2, font: layout.font }),
            new TextRun({ text: job.location || '', italics: true, size: layout.bodySize * 2, font: layout.font, color: layout.accentColor }),
          ],
        })
      );
      if (job.responsibilities) {
        job.responsibilities.split(/[.\n]/).filter(r => r.trim()).forEach((resp) => {
          paragraphs.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 60 },
              children: [new TextRun({ text: resp.trim(), size: layout.bodySize * 2, font: layout.font })],
            })
          );
        });
      }
    });
  }

  // Education
  if (data.education?.length > 0) {
    addSectionHeader('Education');
    data.education.forEach((edu) => {
      const degree = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
      paragraphs.push(
        new Paragraph({
          spacing: { before: layout.itemSpacing },
          children: [
            new TextRun({ text: degree, bold: true, size: layout.bodySize * 2, font: layout.font }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.schoolName || '', size: layout.bodySize * 2, font: layout.font }),
            new TextRun({ text: ` | ${edu.startYear || ''} - ${edu.endYear || 'Present'}`, italics: true, size: layout.bodySize * 2, font: layout.font, color: layout.accentColor }),
          ],
        })
      );
    });
  }

  // Skills
  const hasSkills = data.skills?.technicalSkills?.length > 0 ||
                    data.skills?.softSkills?.length > 0 ||
                    data.skills?.certifications?.length > 0;
  if (hasSkills) {
    addSectionHeader('Skills');
    if (data.skills.technicalSkills?.length > 0) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 80 },
          children: [
            new TextRun({ text: 'Technical: ', bold: true, size: layout.bodySize * 2, font: layout.font }),
            new TextRun({ text: data.skills.technicalSkills.join(', '), size: layout.bodySize * 2, font: layout.font }),
          ],
        })
      );
    }
    if (data.skills.softSkills?.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Soft Skills: ', bold: true, size: layout.bodySize * 2, font: layout.font }),
            new TextRun({ text: data.skills.softSkills.join(', '), size: layout.bodySize * 2, font: layout.font }),
          ],
        })
      );
    }
    if (data.skills.certifications?.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Certifications: ', bold: true, size: layout.bodySize * 2, font: layout.font }),
            new TextRun({ text: data.skills.certifications.join(', '), size: layout.bodySize * 2, font: layout.font }),
          ],
        })
      );
    }
    if (data.skills.languages?.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Languages: ', bold: true, size: layout.bodySize * 2, font: layout.font }),
            new TextRun({
              text: data.skills.languages.map(l => `${l.language} (${l.proficiency})`).join(', '),
              size: layout.bodySize * 2,
              font: layout.font
            }),
          ],
        })
      );
    }
  }

  return new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: layout.margins.top,
            right: layout.margins.right,
            bottom: layout.margins.bottom,
            left: layout.margins.left,
          },
        },
      },
      children: paragraphs,
    }],
  });
}

// =============================================================================
// MODERN TEMPLATE - Two Column Sidebar Layout
// =============================================================================
function generateModernDOCX(data) {
  const layout = LAYOUT_CONFIG.modern;
  const headerParagraphs = [];
  const sidebarParagraphs = [];
  const mainParagraphs = [];

  // Full-width Header
  headerParagraphs.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: data.personalInfo?.fullName || '',
          bold: true,
          size: layout.nameSize * 2,
          font: layout.nameFont,
          color: layout.primaryColor,
        }),
      ],
    })
  );

  // Sidebar Content
  const addSidebarSection = (title, children) => {
    sidebarParagraphs.push(
      new Paragraph({
        spacing: { before: 240, after: 80 },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 20,
            font: layout.font,
            color: layout.primaryColor,
          }),
        ],
      })
    );
    children.forEach(c => sidebarParagraphs.push(c));
  };

  // Contact in sidebar
  addSidebarSection('Contact', [
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: data.personalInfo?.email || '', size: 18, font: layout.font })],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: data.personalInfo?.phone || '', size: 18, font: layout.font })],
    }),
    new Paragraph({
      children: [new TextRun({ text: data.personalInfo?.city || '', size: 18, font: layout.font })],
    }),
  ]);

  // Skills in sidebar
  if (data.skills?.technicalSkills?.length > 0) {
    const skillParagraphs = data.skills.technicalSkills.map(skill =>
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: skill, size: 18, font: layout.font })],
      })
    );
    addSidebarSection('Skills', skillParagraphs);
  }

  // Languages in sidebar
  if (data.skills?.languages?.length > 0) {
    const langParagraphs = data.skills.languages.map(lang =>
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: lang.language, bold: true, size: 18, font: layout.font }),
          new TextRun({ text: ` - ${lang.proficiency}`, size: 18, font: layout.font }),
        ],
      })
    );
    addSidebarSection('Languages', langParagraphs);
  }

  // Certifications in sidebar
  if (data.skills?.certifications?.length > 0) {
    const certParagraphs = data.skills.certifications.map(cert =>
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: cert, size: 18, font: layout.font })],
      })
    );
    addSidebarSection('Certifications', certParagraphs);
  }

  // Main Content
  const addMainSection = (title) => {
    mainParagraphs.push(
      new Paragraph({
        spacing: { before: 300, after: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: layout.primaryColor } },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 22,
            font: layout.font,
            color: layout.primaryColor,
          }),
        ],
      })
    );
  };

  // Work Experience in main
  if (data.workExperience?.length > 0) {
    addMainSection('Experience');
    data.workExperience.forEach((job) => {
      mainParagraphs.push(
        new Paragraph({
          spacing: { before: 160 },
          children: [
            new TextRun({ text: job.jobTitle || '', bold: true, size: 20, font: layout.font }),
          ],
        })
      );
      mainParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: job.companyName || '', size: 18, font: layout.font, color: layout.accentColor }),
            new TextRun({ text: ` | ${job.location || ''}`, size: 18, font: layout.font, color: '666666' }),
          ],
        })
      );
      const dateRange = job.isCurrentJob ? `${job.startDate} - Present` : `${job.startDate} - ${job.endDate}`;
      mainParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: dateRange, italics: true, size: 18, font: layout.font, color: '666666' })],
        })
      );
      if (job.responsibilities) {
        job.responsibilities.split(/[.\n]/).filter(r => r.trim()).forEach((resp) => {
          mainParagraphs.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 40 },
              children: [new TextRun({ text: resp.trim(), size: 18, font: layout.font })],
            })
          );
        });
      }
    });
  }

  // Education in main
  if (data.education?.length > 0) {
    addMainSection('Education');
    data.education.forEach((edu) => {
      const degree = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
      mainParagraphs.push(
        new Paragraph({
          spacing: { before: 120 },
          children: [new TextRun({ text: degree, bold: true, size: 20, font: layout.font })],
        })
      );
      mainParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.schoolName || '', size: 18, font: layout.font }),
            new TextRun({ text: ` | ${edu.startYear || ''} - ${edu.endYear || 'Present'}`, italics: true, size: 18, font: layout.font, color: '666666' }),
          ],
        })
      );
    });
  }

  // Two-column table
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
    columnWidths: [convertInchesToTwip(2.2), convertInchesToTwip(4.8)],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            shading: { fill: layout.sidebarBackground, type: ShadingType.SOLID },
            margins: { top: 200, bottom: 200, left: 150, right: 150 },
            children: sidebarParagraphs.length > 0 ? sidebarParagraphs : [new Paragraph({})],
          }),
          new TableCell({
            width: { size: 68, type: WidthType.PERCENTAGE },
            margins: { top: 200, bottom: 200, left: 200, right: 100 },
            children: mainParagraphs.length > 0 ? mainParagraphs : [new Paragraph({})],
          }),
        ],
      }),
    ],
  });

  return new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: layout.margins.top,
            right: layout.margins.right,
            bottom: layout.margins.bottom,
            left: layout.margins.left,
          },
        },
      },
      children: [...headerParagraphs, twoColumnTable],
    }],
  });
}

// =============================================================================
// PROFESSIONAL TEMPLATE - Compact Split Layout
// =============================================================================
function generateProfessionalDOCX(data) {
  const layout = LAYOUT_CONFIG.professional;
  const elements = [];

  // Split Header Table (Name left, Contact right)
  const contactLines = [
    data.personalInfo?.email,
    data.personalInfo?.phone,
    data.personalInfo?.city,
  ].filter(Boolean);

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
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: (data.personalInfo?.fullName || '').toUpperCase(),
                    bold: true,
                    size: layout.nameSize * 2,
                    font: layout.nameFont,
                    color: layout.primaryColor,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            children: contactLines.map(line =>
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: line, size: 18, font: layout.font, color: layout.accentColor })],
              })
            ),
          }),
        ],
      }),
    ],
  });
  elements.push(headerTable);

  // Divider
  elements.push(
    new Paragraph({
      spacing: { before: 120, after: 200 },
      border: { bottom: { style: BorderStyle.DOUBLE, size: 6, color: layout.primaryColor } },
      children: [],
    })
  );

  // Helper for section headers
  const addSectionHeader = (title) => {
    elements.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: layout.sectionHeaderSize * 2,
            font: layout.font,
            color: layout.primaryColor,
          }),
        ],
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: layout.accentColor } },
      })
    );
  };

  // Work Experience
  if (data.workExperience?.length > 0) {
    addSectionHeader('Professional Experience');
    data.workExperience.forEach((job) => {
      const dateRange = job.isCurrentJob ? `${job.startDate} - Present` : `${job.startDate} - ${job.endDate}`;
      elements.push(
        new Paragraph({
          spacing: { before: 120 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: job.jobTitle || '', bold: true, size: 20, font: layout.font }),
            new TextRun({ text: ` | ${job.companyName || ''}`, size: 20, font: layout.font }),
            new TextRun({ text: '\t' }),
            new TextRun({ text: dateRange, size: 18, font: layout.font, color: layout.accentColor }),
          ],
        })
      );
      if (job.responsibilities) {
        job.responsibilities.split(/[.\n]/).filter(r => r.trim()).slice(0, 3).forEach((resp) => {
          elements.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 40 },
              children: [new TextRun({ text: resp.trim(), size: 18, font: layout.font })],
            })
          );
        });
      }
    });
  }

  // Two-column Skills + Education
  const skillsContent = [];
  const eduContent = [];

  // Skills column
  if (data.skills?.technicalSkills?.length > 0) {
    skillsContent.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'SKILLS', bold: true, size: 20, font: layout.font, color: layout.primaryColor }),
        ],
      })
    );
    skillsContent.push(
      new Paragraph({
        children: [new TextRun({ text: data.skills.technicalSkills.join(' | '), size: 18, font: layout.font })],
      })
    );
  }
  if (data.skills?.certifications?.length > 0) {
    skillsContent.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({ text: 'CERTIFICATIONS', bold: true, size: 20, font: layout.font, color: layout.primaryColor }),
        ],
      })
    );
    data.skills.certifications.forEach(cert => {
      skillsContent.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: cert, size: 18, font: layout.font })],
        })
      );
    });
  }

  // Education column
  if (data.education?.length > 0) {
    eduContent.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'EDUCATION', bold: true, size: 20, font: layout.font, color: layout.primaryColor }),
        ],
      })
    );
    data.education.forEach((edu) => {
      const degree = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
      eduContent.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: degree, bold: true, size: 18, font: layout.font }),
          ],
        })
      );
      eduContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${edu.schoolName} (${edu.endYear || 'Present'})`, size: 18, font: layout.font, color: layout.accentColor }),
          ],
        })
      );
    });
  }

  // Two-column table for Skills + Education
  if (skillsContent.length > 0 || eduContent.length > 0) {
    elements.push(
      new Paragraph({ spacing: { before: 200 }, children: [] })
    );
    elements.push(
      new Table({
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
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                margins: { right: 200 },
                children: skillsContent.length > 0 ? skillsContent : [new Paragraph({})],
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                margins: { left: 200 },
                children: eduContent.length > 0 ? eduContent : [new Paragraph({})],
              }),
            ],
          }),
        ],
      })
    );
  }

  return new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: layout.margins.top,
            right: layout.margins.right,
            bottom: layout.margins.bottom,
            left: layout.margins.left,
          },
        },
      },
      children: elements,
    }],
  });
}

// =============================================================================
// PDF GENERATION
// =============================================================================
function generateClassicPDF(data) {
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 50;
  let y = 60;

  // Centered Name
  pdf.setFont('times', 'bold');
  pdf.setFontSize(24);
  const name = data.personalInfo?.fullName || '';
  const nameWidth = pdf.getTextWidth(name);
  pdf.text(name, (pageWidth - nameWidth) / 2, y);
  y += 25;

  // Centered Contact
  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(80, 80, 80);
  const contact = [data.personalInfo?.email, data.personalInfo?.phone, data.personalInfo?.city].filter(Boolean).join(' | ');
  const contactWidth = pdf.getTextWidth(contact);
  pdf.text(contact, (pageWidth - contactWidth) / 2, y);
  pdf.setTextColor(0, 0, 0);
  y += 35;

  // Section helper
  const addSection = (title) => {
    y += 15;
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12);
    pdf.text(title.toUpperCase(), margin, y);
    y += 3;
    pdf.setDrawColor(0);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 15;
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
  };

  // Work Experience
  if (data.workExperience?.length > 0) {
    addSection('Work Experience');
    data.workExperience.forEach((job) => {
      pdf.setFont('times', 'bold');
      pdf.text(`${job.jobTitle} | ${job.companyName}`, margin, y);
      y += 14;
      pdf.setFont('times', 'italic');
      pdf.setTextColor(80, 80, 80);
      const dateRange = job.isCurrentJob ? `${job.startDate} - Present` : `${job.startDate} - ${job.endDate}`;
      pdf.text(`${dateRange} | ${job.location || ''}`, margin, y);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('times', 'normal');
      y += 14;
      if (job.responsibilities) {
        job.responsibilities.split(/[.\n]/).filter(r => r.trim()).forEach((resp) => {
          pdf.text(`- ${resp.trim()}`, margin + 10, y);
          y += 12;
        });
      }
      y += 5;
    });
  }

  // Education
  if (data.education?.length > 0) {
    addSection('Education');
    data.education.forEach((edu) => {
      const degree = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
      pdf.setFont('times', 'bold');
      pdf.text(degree, margin, y);
      y += 14;
      pdf.setFont('times', 'normal');
      pdf.text(`${edu.schoolName} | ${edu.startYear || ''} - ${edu.endYear || 'Present'}`, margin, y);
      y += 18;
    });
  }

  // Skills
  const hasSkills = data.skills?.technicalSkills?.length > 0 || data.skills?.certifications?.length > 0;
  if (hasSkills) {
    addSection('Skills');
    if (data.skills.technicalSkills?.length > 0) {
      pdf.setFont('times', 'bold');
      pdf.text('Technical: ', margin, y);
      const techWidth = pdf.getTextWidth('Technical: ');
      pdf.setFont('times', 'normal');
      pdf.text(data.skills.technicalSkills.join(', '), margin + techWidth, y);
      y += 14;
    }
    if (data.skills.certifications?.length > 0) {
      pdf.setFont('times', 'bold');
      pdf.text('Certifications: ', margin, y);
      const certWidth = pdf.getTextWidth('Certifications: ');
      pdf.setFont('times', 'normal');
      pdf.text(data.skills.certifications.join(', '), margin + certWidth, y);
      y += 14;
    }
  }

  return pdf;
}

function generateModernPDF(data) {
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const sidebarWidth = pageWidth * 0.32;

  // Draw sidebar background FIRST (full height from top)
  pdf.setFillColor(240, 244, 248);
  pdf.rect(0, 0, sidebarWidth, pageHeight, 'F');

  // Name in header area (on sidebar background)
  let y = 50;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(26, 26, 26);
  pdf.text(data.personalInfo?.fullName || '', 15, y);
  y += 8;

  // Accent bar under name (full width)
  pdf.setDrawColor(26, 26, 26);
  pdf.setLineWidth(2);
  pdf.line(15, y, pageWidth - margin, y);
  pdf.setTextColor(0, 0, 0);
  y += 20;

  const sidebarStartY = y;

  // Sidebar content
  let sidebarY = sidebarStartY + 20;
  const sidebarMargin = 15;

  const addSidebarSection = (title) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(26, 26, 26);
    pdf.text(title.toUpperCase(), sidebarMargin, sidebarY);
    sidebarY += 14;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
  };

  // Contact
  addSidebarSection('Contact');
  [data.personalInfo?.email, data.personalInfo?.phone, data.personalInfo?.city].filter(Boolean).forEach(line => {
    pdf.text(line, sidebarMargin, sidebarY);
    sidebarY += 12;
  });
  sidebarY += 10;

  // Skills
  if (data.skills?.technicalSkills?.length > 0) {
    addSidebarSection('Skills');
    data.skills.technicalSkills.forEach(skill => {
      pdf.text(`- ${skill}`, sidebarMargin, sidebarY);
      sidebarY += 11;
    });
    sidebarY += 10;
  }

  // Languages
  if (data.skills?.languages?.length > 0) {
    addSidebarSection('Languages');
    data.skills.languages.forEach(lang => {
      pdf.text(`${lang.language} - ${lang.proficiency}`, sidebarMargin, sidebarY);
      sidebarY += 11;
    });
    sidebarY += 10;
  }

  // Certifications
  if (data.skills?.certifications?.length > 0) {
    addSidebarSection('Certifications');
    data.skills.certifications.forEach(cert => {
      const lines = pdf.splitTextToSize(`- ${cert}`, sidebarWidth - 25);
      lines.forEach(line => {
        pdf.text(line, sidebarMargin, sidebarY);
        sidebarY += 11;
      });
    });
  }

  // Main content
  let mainY = sidebarStartY + 10;
  const mainX = sidebarWidth + 15;
  const mainWidth = pageWidth - sidebarWidth - margin - 15;

  const addMainSection = (title) => {
    mainY += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(26, 26, 26);
    pdf.text(title.toUpperCase(), mainX, mainY);
    mainY += 3;
    pdf.setDrawColor(26, 26, 26);
    pdf.line(mainX, mainY, mainX + mainWidth, mainY);
    mainY += 15;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
  };

  // Experience
  if (data.workExperience?.length > 0) {
    addMainSection('Experience');
    data.workExperience.forEach((job) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(job.jobTitle || '', mainX, mainY);
      mainY += 12;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${job.companyName} | ${job.location || ''}`, mainX, mainY);
      mainY += 12;
      const dateRange = job.isCurrentJob ? `${job.startDate} - Present` : `${job.startDate} - ${job.endDate}`;
      pdf.setFont('helvetica', 'italic');
      pdf.text(dateRange, mainX, mainY);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      mainY += 12;
      if (job.responsibilities) {
        job.responsibilities.split(/[.\n]/).filter(r => r.trim()).forEach((resp) => {
          const lines = pdf.splitTextToSize(`- ${resp.trim()}`, mainWidth - 10);
          lines.forEach(line => {
            pdf.text(line, mainX + 5, mainY);
            mainY += 11;
          });
        });
      }
      mainY += 8;
    });
  }

  // Education
  if (data.education?.length > 0) {
    addMainSection('Education');
    data.education.forEach((edu) => {
      const degree = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
      pdf.setFont('helvetica', 'bold');
      pdf.text(degree, mainX, mainY);
      mainY += 12;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${edu.schoolName} | ${edu.startYear || ''} - ${edu.endYear || 'Present'}`, mainX, mainY);
      mainY += 16;
    });
  }

  return pdf;
}

function generateProfessionalPDF(data) {
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 40;
  let y = 45;

  // Split header - Name left
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(31, 41, 55);
  pdf.text((data.personalInfo?.fullName || '').toUpperCase(), margin, y);

  // Contact right
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(55, 65, 81);
  let contactY = y - 15;
  [data.personalInfo?.email, data.personalInfo?.phone, data.personalInfo?.city].filter(Boolean).forEach(line => {
    const lineWidth = pdf.getTextWidth(line);
    pdf.text(line, pageWidth - margin - lineWidth, contactY);
    contactY += 11;
  });

  pdf.setTextColor(0, 0, 0);
  y += 15;

  // Double divider
  pdf.setDrawColor(31, 41, 55);
  pdf.setLineWidth(1.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 25;

  // Section helper
  const addSection = (title) => {
    y += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    pdf.text(title.toUpperCase(), margin, y);
    y += 3;
    pdf.setDrawColor(55, 65, 81);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 12;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
  };

  // Work Experience
  if (data.workExperience?.length > 0) {
    addSection('Professional Experience');
    data.workExperience.forEach((job) => {
      const dateRange = job.isCurrentJob ? `${job.startDate} - Present` : `${job.startDate} - ${job.endDate}`;
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${job.jobTitle} | ${job.companyName}`, margin, y);
      const dateWidth = pdf.getTextWidth(dateRange);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);
      pdf.text(dateRange, pageWidth - margin - dateWidth, y);
      pdf.setTextColor(0, 0, 0);
      y += 12;
      if (job.responsibilities) {
        job.responsibilities.split(/[.\n]/).filter(r => r.trim()).slice(0, 3).forEach((resp) => {
          pdf.text(`- ${resp.trim()}`, margin + 10, y);
          y += 10;
        });
      }
      y += 6;
    });
  }

  // Two-column Skills + Education
  const colWidth = (pageWidth - margin * 2 - 20) / 2;
  const col1X = margin;
  const col2X = margin + colWidth + 20;
  let col1Y = y + 15;
  let col2Y = y + 15;

  // Skills column
  if (data.skills?.technicalSkills?.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    pdf.text('SKILLS', col1X, col1Y);
    col1Y += 12;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    const skillsText = data.skills.technicalSkills.join(' | ');
    const skillLines = pdf.splitTextToSize(skillsText, colWidth);
    skillLines.forEach(line => {
      pdf.text(line, col1X, col1Y);
      col1Y += 10;
    });
  }

  if (data.skills?.certifications?.length > 0) {
    col1Y += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    pdf.text('CERTIFICATIONS', col1X, col1Y);
    col1Y += 12;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    data.skills.certifications.forEach(cert => {
      pdf.text(`- ${cert}`, col1X, col1Y);
      col1Y += 10;
    });
  }

  // Education column
  if (data.education?.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    pdf.text('EDUCATION', col2X, col2Y);
    col2Y += 12;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    data.education.forEach((edu) => {
      const degree = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
      pdf.setFont('helvetica', 'bold');
      pdf.text(degree, col2X, col2Y);
      col2Y += 10;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);
      pdf.text(`${edu.schoolName} (${edu.endYear || 'Present'})`, col2X, col2Y);
      pdf.setTextColor(0, 0, 0);
      col2Y += 14;
    });
  }

  return pdf;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================
async function main() {
  const outputDir = './test-output';
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log('Generating resume templates...\n');

  const generators = {
    classic: { docx: generateClassicDOCX, pdf: generateClassicPDF },
    modern: { docx: generateModernDOCX, pdf: generateModernPDF },
    professional: { docx: generateProfessionalDOCX, pdf: generateProfessionalPDF },
  };

  for (const [template, gen] of Object.entries(generators)) {
    console.log(`=== ${template.toUpperCase()} ===`);

    // DOCX
    try {
      const docx = gen.docx(fullResumeData);
      const buffer = await Packer.toBuffer(docx);
      const path = `${outputDir}/${template}.docx`;
      writeFileSync(path, buffer);
      console.log(`  DOCX: ${path}`);
    } catch (err) {
      console.error(`  DOCX ERROR: ${err.message}`);
    }

    // PDF
    try {
      const pdf = gen.pdf(fullResumeData);
      const path = `${outputDir}/${template}.pdf`;
      pdf.save(path);
      console.log(`  PDF:  ${path}`);
    } catch (err) {
      console.error(`  PDF ERROR: ${err.message}`);
    }

    console.log('');
  }

  console.log('Done! Files saved to ./test-output/');
  console.log('\nExpected layouts:');
  console.log('  Classic:      Centered header, full-width section underlines');
  console.log('  Modern:       Gray sidebar (left), main content (right)');
  console.log('  Professional: Split header (name left/contact right), two-column bottom');
}

main().catch(console.error);
