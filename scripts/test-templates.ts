/**
 * Template Test Script
 * Generates DOCX and PDF files for all 3 templates to visually verify layouts
 *
 * Usage: npx tsx scripts/test-templates.ts
 */

import { generateResumeDOCX, generateResumePDF } from '../src/lib/resumeGenerator';
import { Packer } from 'docx';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import type { ResumeData } from '../src/types';

// Full test data with all sections populated
const fullResumeData: ResumeData = {
  language: 'en',
  personalInfo: {
    fullName: 'John Test Smith',
    email: 'john.test@example.com',
    phone: '(555) 123-4567',
    city: 'Austin, TX',
    zipCode: '78701',
  },
  hasWorkExperience: true,
  workExperience: [
    {
      id: 'work-1',
      jobTitle: 'Senior Software Engineer',
      companyName: 'Tech Innovation Corp',
      location: 'Austin, TX',
      startDate: 'January 2022',
      endDate: '',
      isCurrentJob: true,
      responsibilities: 'Led development of microservices architecture serving 10M+ users. Mentored team of 5 junior developers. Reduced deployment time by 60% through CI/CD improvements. Implemented real-time data processing pipeline.',
    },
    {
      id: 'work-2',
      jobTitle: 'Software Developer',
      companyName: 'Digital Solutions LLC',
      location: 'San Francisco, CA',
      startDate: 'June 2019',
      endDate: 'December 2021',
      isCurrentJob: false,
      responsibilities: 'Built RESTful APIs using Node.js and Express. Developed React frontend applications. Collaborated with product team on feature specifications. Maintained 95% test coverage.',
    },
    {
      id: 'work-3',
      jobTitle: 'Junior Developer',
      companyName: 'StartupXYZ',
      location: 'Remote',
      startDate: 'January 2018',
      endDate: 'May 2019',
      isCurrentJob: false,
      responsibilities: 'Developed web applications using JavaScript and Python. Participated in code reviews and agile ceremonies.',
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
      isCurrentlyStudying: false,
    },
    {
      id: 'edu-2',
      schoolName: 'Austin Community College',
      degree: 'Associate',
      fieldOfStudy: 'Information Technology',
      startYear: '2012',
      endYear: '2014',
      isCurrentlyStudying: false,
    },
  ],
  skills: {
    technicalSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'PostgreSQL', 'AWS', 'Docker'],
    softSkills: ['Leadership', 'Communication', 'Problem Solving', 'Team Collaboration'],
    certifications: ['AWS Certified Developer', 'Google Cloud Professional', 'Certified Scrum Master'],
    languages: [
      { language: 'English', proficiency: 'Native' },
      { language: 'Spanish', proficiency: 'Conversational' },
    ],
  },
  hasVolunteering: true,
  volunteering: [
    {
      id: 'vol-1',
      organizationName: 'Code for Good',
      role: 'Volunteer Developer',
      startDate: 'January 2020',
      endDate: 'December 2021',
      responsibilities: 'Built websites and applications for local nonprofits. Led weekend coding workshops.',
    },
    {
      id: 'vol-2',
      organizationName: 'Tech Mentors Network',
      role: 'Mentor',
      startDate: 'June 2022',
      endDate: '',
      responsibilities: 'Mentoring aspiring developers through weekly 1-on-1 sessions.',
    },
  ],
  hasReferences: true,
  references: [
    {
      id: 'ref-1',
      name: 'Jane Manager',
      jobTitle: 'Engineering Director',
      company: 'Tech Innovation Corp',
      email: 'jane.manager@techinnovation.com',
      phone: '(555) 987-6543',
      relationship: 'Current Manager',
    },
    {
      id: 'ref-2',
      name: 'Bob Colleague',
      jobTitle: 'Senior Engineer',
      company: 'Digital Solutions LLC',
      email: 'bob.colleague@email.com',
      relationship: 'Former Colleague',
    },
  ],
  referencesUponRequest: false,
  templateStyle: 'classic', // Will be overridden for each template
};

// Minimal test data to verify layouts with sparse content
const minimalResumeData: ResumeData = {
  language: 'en',
  personalInfo: {
    fullName: 'Jane Minimal',
    email: 'jane@example.com',
    phone: '(555) 000-1111',
    city: 'New York, NY',
  },
  hasWorkExperience: true,
  workExperience: [
    {
      id: 'work-1',
      jobTitle: 'Developer',
      companyName: 'Company Inc',
      location: 'New York, NY',
      startDate: 'Jan 2023',
      isCurrentJob: true,
      responsibilities: 'Software development tasks.',
    },
  ],
  education: [
    {
      id: 'edu-1',
      schoolName: 'State University',
      degree: 'BS',
      fieldOfStudy: 'Computer Science',
      endYear: '2022',
      isCurrentlyStudying: false,
    },
  ],
  skills: {
    technicalSkills: ['JavaScript', 'Python'],
    softSkills: [],
    certifications: [],
    languages: [],
  },
  hasVolunteering: false,
  hasReferences: false,
  referencesUponRequest: true,
  templateStyle: 'classic',
};

const templates = ['classic', 'modern', 'professional'] as const;

async function generateAllTemplates() {
  const outputDir = './test-output';

  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log('Generating resume templates...\n');

  for (const template of templates) {
    console.log(`=== ${template.toUpperCase()} TEMPLATE ===`);

    // Full resume
    const fullData = { ...fullResumeData, templateStyle: template };

    // Generate DOCX
    try {
      const docx = generateResumeDOCX(fullData);
      const buffer = await Packer.toBuffer(docx);
      const docxPath = `${outputDir}/${template}-full.docx`;
      writeFileSync(docxPath, buffer);
      console.log(`  DOCX (full): ${docxPath}`);
    } catch (err) {
      console.error(`  DOCX (full) ERROR: ${err}`);
    }

    // Generate PDF
    try {
      const pdf = generateResumePDF(fullData);
      const pdfPath = `${outputDir}/${template}-full.pdf`;
      pdf.save(pdfPath);
      console.log(`  PDF (full):  ${pdfPath}`);
    } catch (err) {
      console.error(`  PDF (full) ERROR: ${err}`);
    }

    // Minimal resume
    const minData = { ...minimalResumeData, templateStyle: template };

    // Generate DOCX
    try {
      const docx = generateResumeDOCX(minData);
      const buffer = await Packer.toBuffer(docx);
      const docxPath = `${outputDir}/${template}-minimal.docx`;
      writeFileSync(docxPath, buffer);
      console.log(`  DOCX (min):  ${docxPath}`);
    } catch (err) {
      console.error(`  DOCX (min) ERROR: ${err}`);
    }

    // Generate PDF
    try {
      const pdf = generateResumePDF(minData);
      const pdfPath = `${outputDir}/${template}-minimal.pdf`;
      pdf.save(pdfPath);
      console.log(`  PDF (min):   ${pdfPath}`);
    } catch (err) {
      console.error(`  PDF (min) ERROR: ${err}`);
    }

    console.log('');
  }

  console.log('Done! Check the ./test-output directory for generated files.');
  console.log('\nExpected layouts:');
  console.log('  - Classic:      Single-column, centered header, full-width underlines');
  console.log('  - Modern:       Two-column sidebar (gray bg left, main content right)');
  console.log('  - Professional: Split header, two-column skills/education sections');
}

generateAllTemplates().catch(console.error);
