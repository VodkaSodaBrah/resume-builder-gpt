/**
 * Playwright script to download the Modern template PDF
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';

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
      isCurrentJob: true,
      responsibilities: 'Led development of microservices architecture. Mentored junior developers. Reduced deployment time by 60%.',
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
    softSkills: ['Leadership', 'Communication'],
    certifications: ['AWS Certified Developer', 'Google Cloud Professional'],
    languages: [
      { language: 'English', proficiency: 'Native' },
      { language: 'Spanish', proficiency: 'Conversational' },
    ],
  },
  templateStyle: 'modern',
};

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    acceptDownloads: true,
  });
  const page = await context.newPage();

  // Navigate to app
  await page.goto('http://localhost:3001');

  // Set up localStorage
  await page.evaluate((data) => {
    localStorage.setItem('dev_auth_signed_in', 'true');
    const storeData = {
      state: {
        currentCategory: 'review',
        messages: [],
        resumeData: data,
        isComplete: true,
        workExperienceCount: data.workExperience?.length || 0,
        educationCount: data.education?.length || 0,
      },
      version: 0,
    };
    localStorage.setItem('resume-builder-conversation', JSON.stringify(storeData));
    localStorage.setItem('resume-builder-ai-conversation', JSON.stringify(storeData));
  }, fullResumeData);

  // Navigate to preview
  await page.goto('http://localhost:3001/preview/new');
  await page.waitForSelector('text=John Test Smith', { timeout: 10000 });

  // Select Modern template
  console.log('Selecting Modern template...');
  await page.click('text=Modern');
  await page.waitForTimeout(500);

  // Click Download PDF and wait for download
  console.log('Downloading PDF...');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('text=Download PDF'),
  ]);

  // Save the download
  const downloadPath = 'test-output/modern-app-download.pdf';
  await download.saveAs(downloadPath);
  console.log(`PDF saved to: ${downloadPath}`);

  // Open the PDF
  const { exec } = await import('child_process');
  exec(`open ${downloadPath}`);

  await browser.close();
  console.log('Done!');
}

main().catch(console.error);
