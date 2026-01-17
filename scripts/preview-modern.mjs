/**
 * Playwright script to preview the Modern template
 * Opens browser, loads test data, and shows the preview
 */

import { chromium } from 'playwright';

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
  templateStyle: 'modern',
};

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  // Navigate to app
  console.log('Navigating to app...');
  await page.goto('http://localhost:3001');

  // Set up localStorage with test data
  console.log('Setting up test data...');
  await page.evaluate((data) => {
    localStorage.setItem('dev_auth_signed_in', 'true');

    const conversationStoreData = {
      state: {
        currentQuestionIndex: 0,
        currentCategory: 'review',
        messages: [],
        resumeData: data,
        isTyping: false,
        isComplete: true,
        workExperienceCount: data.workExperience?.length || 0,
        educationCount: data.education?.length || 0,
        volunteeringCount: data.volunteering?.length || 0,
        referenceCount: data.references?.length || 0,
      },
      version: 0,
    };
    localStorage.setItem('resume-builder-conversation', JSON.stringify(conversationStoreData));

    const aiStoreData = {
      state: {
        currentQuestionIndex: 0,
        currentCategory: 'review',
        messages: [],
        resumeData: data,
        workExperienceCount: data.workExperience?.length || 0,
        educationCount: data.education?.length || 0,
        volunteeringCount: data.volunteering?.length || 0,
        referenceCount: data.references?.length || 0,
        isAIMode: true,
        isComplete: true,
        isTyping: false,
        conversationContext: {
          mentionedEntities: [],
          answeredTopics: [],
          userTone: 'neutral',
          sessionStartTime: new Date().toISOString(),
        },
        followUpCounts: {},
        tokenUsage: { input: 0, output: 0, total: 0 },
        emailHelpShown: false,
      },
      version: 0,
    };
    localStorage.setItem('resume-builder-ai-conversation', JSON.stringify(aiStoreData));
  }, fullResumeData);

  // Navigate to preview
  console.log('Opening preview page...');
  await page.goto('http://localhost:3001/preview/new');

  // Wait for content to load
  await page.waitForSelector('text=John Test Smith', { timeout: 10000 });

  // Click on Modern template
  console.log('Selecting Modern template...');
  await page.click('text=Modern');

  // Wait a moment for re-render
  await page.waitForTimeout(1000);

  // Take screenshot
  const screenshotPath = 'test-output/modern-preview-live.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved to: ${screenshotPath}`);

  console.log('\nBrowser is open. Press Ctrl+C to close when done viewing.');

  // Keep browser open for viewing
  await new Promise(() => {}); // Wait indefinitely
}

main().catch(console.error);
