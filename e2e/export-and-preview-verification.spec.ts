import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * E2E Tests for Resume Export & Preview Content Verification
 *
 * Uses localStorage injection to load the Preview page directly with known
 * resume data -- no need to replay the full conversation. Fast (~30s) and isolated.
 *
 * Tests:
 * 1. Preview page renders all sections with correct data, no "undefined"
 * 2. PDF download: fires, correct filename, size > 1KB, text extraction
 * 3. DOCX download: fires, correct filename, size > 1KB
 */

test.describe.configure({ mode: 'serial' });

// ============================================================================
// FIXTURE DATA
// ============================================================================

const janeTestDoeResumeData = {
  personalInfo: {
    fullName: 'Jane Test Doe',
    email: 'jane.test@example.com',
    phone: '(555) 987-6543',
    city: 'Austin, TX',
    zipcode: '78701',
  },
  workExperience: [
    {
      id: 'work-1',
      jobTitle: 'Senior Developer',
      companyName: 'Acme Corporation',
      location: 'Austin, TX',
      startDate: 'January 2021',
      isCurrentJob: true,
      responsibilities: 'Led development of web applications using React and Node.js',
      enhancedResponsibilities: 'Led development of web applications using React and Node.js',
    },
    {
      id: 'work-2',
      jobTitle: 'Software Engineer',
      companyName: 'StartupXYZ',
      location: 'San Francisco, CA',
      startDate: 'March 2018',
      endDate: 'December 2020',
      isCurrentJob: false,
      responsibilities: 'Built REST APIs serving 10K+ daily requests',
      enhancedResponsibilities: 'Built REST APIs serving 10K+ daily requests',
    },
  ],
  education: [
    {
      id: 'edu-1',
      schoolName: 'University of Texas at Austin',
      degree: 'BS',
      fieldOfStudy: 'Computer Science',
      startYear: '2014',
      endYear: '2018',
      isCurrentlyStudying: false,
    },
    {
      id: 'edu-2',
      schoolName: 'Austin Community College',
      degree: 'AA',
      fieldOfStudy: 'Business Administration',
      startYear: '2012',
      endYear: '2014',
      isCurrentlyStudying: false,
    },
  ],
  volunteering: [
    {
      id: 'vol-1',
      organizationName: 'Code for Austin',
      role: 'Volunteer Developer',
      startDate: 'January 2020',
      endDate: 'Present',
      responsibilities: 'Built civic tech applications for local nonprofits',
    },
    {
      id: 'vol-2',
      organizationName: 'Habitat for Humanity',
      role: 'Construction Volunteer',
      startDate: 'June 2019',
      endDate: 'December 2019',
      responsibilities: 'Helped build affordable housing units',
    },
  ],
  skills: {
    technicalSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'],
    softSkills: ['Leadership', 'Problem Solving', 'Communication', 'Team Collaboration'],
    certifications: ['AWS Certified Developer', 'Google Cloud Professional'],
    languages: [
      { language: 'English', proficiency: 'native' },
      { language: 'Spanish', proficiency: 'conversational' },
    ],
  },
  references: [
    {
      id: 'ref-1',
      name: 'Bob Manager',
      jobTitle: 'Engineering Director',
      company: 'Acme Corporation',
      email: 'bob.manager@acme.com',
      relationship: 'Direct supervisor',
    },
    {
      id: 'ref-2',
      name: 'Alice Mentor',
      jobTitle: 'VP of Engineering',
      company: 'StartupXYZ',
      phone: '(555) 111-2222',
      relationship: 'Former manager',
    },
  ],
  templateStyle: 'modern',
};

// ============================================================================
// HELPER
// ============================================================================

/**
 * Navigate to preview with mock data via localStorage injection.
 * Reuses the pattern from resume-generation.spec.ts.
 */
async function navigateToPreviewWithData(
  page: Page,
  resumeData: typeof janeTestDoeResumeData
) {
  // Block the AI enhance API to prevent infinite retry loops in test env
  await page.route('**/api/resume/enhance', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ success: false }) })
  );

  await page.goto('/');

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
      version: 1,
    };
    localStorage.setItem(
      'resume-builder-conversation',
      JSON.stringify(conversationStoreData)
    );

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
        followUpCounts: {
          language: 0, intro: 0, personal: 0, work: 0,
          education: 0, volunteering: 0, skills: 0, references: 0, review: 0, complete: 0,
        },
        extractedButUnconfirmed: [],
        pendingFollowUp: null,
        emailHelpShown: false,
        userEscapeRequested: false,
        aiResponseTimes: [],
        tokenUsage: { input: 0, output: 0, total: 0 },
      },
      version: 1,
    };
    localStorage.setItem(
      'resume-builder-ai-conversation',
      JSON.stringify(aiStoreData)
    );
  }, resumeData);

  await page.goto('/preview/new', { waitUntil: 'load' });
  await page.waitForSelector(`text=${resumeData.personalInfo.fullName}`, {
    timeout: 15000,
  });
}

// ============================================================================
// TESTS: Preview Content
// ============================================================================

test.describe('Resume Preview Content Verification', () => {
  test('all sections render with correct data and no "undefined"', async ({
    page,
  }) => {
    await navigateToPreviewWithData(page, janeTestDoeResumeData);

    // -- Personal Info --
    const heading = page.locator('h1');
    await expect(heading).toContainText('Jane Test Doe');

    const contactLine = page.locator('p.text-center.text-sm.text-gray-600');
    await expect(contactLine.first()).toContainText('jane.test@example.com');
    await expect(contactLine.first()).toContainText('(555) 987-6543');
    await expect(contactLine.first()).toContainText('Austin, TX');

    // -- Section Headers --
    await expect(page.locator('h2', { hasText: 'Work Experience' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Education' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Volunteer Experience' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Skills' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'References' })).toBeVisible();

    // -- Work Experience entries --
    await expect(page.getByText('Acme Corporation')).toBeVisible();
    await expect(page.getByText('Senior Developer')).toBeVisible();
    await expect(page.getByText('StartupXYZ')).toBeVisible();
    await expect(page.getByText('Software Engineer')).toBeVisible();

    // -- Education entries --
    await expect(page.getByText('University of Texas at Austin')).toBeVisible();
    await expect(page.getByText('Computer Science')).toBeVisible();
    await expect(page.getByText('Austin Community College')).toBeVisible();
    await expect(page.getByText('Business Administration')).toBeVisible();

    // -- Volunteering entries --
    await expect(page.getByText('Code for Austin')).toBeVisible();
    await expect(page.getByText('Volunteer Developer')).toBeVisible();
    await expect(page.getByText('Habitat for Humanity')).toBeVisible();
    await expect(page.getByText('Construction Volunteer')).toBeVisible();

    // -- Skills sub-categories --
    await expect(page.getByText('Technical:')).toBeVisible();
    await expect(page.getByText('Certifications:')).toBeVisible();
    await expect(page.getByText('Languages:')).toBeVisible();
    await expect(page.getByText('Soft Skills:')).toBeVisible();

    // -- References entries --
    await expect(page.getByText('Bob Manager')).toBeVisible();
    await expect(page.getByText('Alice Mentor')).toBeVisible();

    // -- No "undefined" anywhere --
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toContain('undefined');
  });
});

// ============================================================================
// TESTS: PDF Export
// ============================================================================

test.describe('Resume PDF Export', () => {
  test('downloads PDF with correct filename, size, and content', async ({
    page,
  }) => {
    await navigateToPreviewWithData(page, janeTestDoeResumeData);

    // Click "Download PDF" and capture the download event
    const downloadPdfBtn = page.locator('button').filter({ hasText: 'Download PDF' });
    await downloadPdfBtn.waitFor({ state: 'visible', timeout: 10000 });

    const [pdfDownload] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      downloadPdfBtn.click(),
    ]);

    // Assert filename
    expect(pdfDownload.suggestedFilename()).toBe('Jane_Test_Doe_Resume.pdf');

    // Wait for download to complete and get file path
    const pdfPath = await pdfDownload.path();
    expect(pdfPath).toBeTruthy();

    // Assert file size > 1KB
    const pdfBuffer = fs.readFileSync(pdfPath!);
    expect(pdfBuffer.length).toBeGreaterThan(1024);

    // Extract text from PDF and verify key content
    const pdfData = await pdfParse(pdfBuffer);
    const pdfText = pdfData.text;

    expect(pdfText).toContain('Jane Test Doe');
    expect(pdfText).toContain('Acme Corporation');
    expect(pdfText).toContain('Senior Developer');
    expect(pdfText).toContain('University of Texas');
  });
});

// ============================================================================
// TESTS: DOCX Export
// ============================================================================

test.describe('Resume DOCX Export', () => {
  test('downloads DOCX with correct filename and size', async ({ page }) => {
    await navigateToPreviewWithData(page, janeTestDoeResumeData);

    // Click "Download Word (DOCX)" and capture the download event
    const downloadDocxBtn = page
      .locator('button')
      .filter({ hasText: 'Download Word (DOCX)' });
    await downloadDocxBtn.waitFor({ state: 'visible', timeout: 10000 });

    const [docxDownload] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      downloadDocxBtn.click(),
    ]);

    // Assert filename
    expect(docxDownload.suggestedFilename()).toBe(
      'Jane_Test_Doe_Resume.docx'
    );

    // Wait for download to complete and get file path
    const docxPath = await docxDownload.path();
    expect(docxPath).toBeTruthy();

    // Assert file size > 1KB
    const docxBuffer = fs.readFileSync(docxPath!);
    expect(docxBuffer.length).toBeGreaterThan(1024);
  });
});
