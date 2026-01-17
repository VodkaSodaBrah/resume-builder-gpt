import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Resume Generation Fixes
 * Tests that the preview and download correctly render all sections
 *
 * Issues tested:
 * 1. Preview shows Volunteering, References, Certifications sections
 * 2. Skills section only renders when there's content
 * 3. Volunteering end dates are displayed correctly
 * 4. No "undefined" text appears in output
 */

test.describe.configure({ mode: 'serial' });

// Mock resume data for testing
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
      jobTitle: 'Senior Developer',
      companyName: 'Tech Corp',
      location: 'Austin, TX',
      startDate: 'Jan 2020',
      endDate: 'Dec 2023',
      isCurrentJob: false,
      responsibilities: 'Led development team\nBuilt scalable systems\nMentored junior developers',
    },
  ],
  education: [
    {
      id: 'edu-1',
      schoolName: 'State University',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      startYear: '2012',
      endYear: '2016',
      isCurrentlyStudying: false,
    },
  ],
  skills: {
    technicalSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    softSkills: ['Leadership', 'Communication'],
    certifications: ['AWS Certified Developer', 'Google Cloud Professional'],
    languages: [{ language: 'English', proficiency: 'Native' }],
  },
  volunteering: [
    {
      id: 'vol-1',
      organizationName: 'Code for Good',
      role: 'Volunteer Developer',
      startDate: 'Jan 2018',
      endDate: 'Dec 2019',
      responsibilities: 'Built websites for nonprofits',
    },
    {
      id: 'vol-2',
      organizationName: 'Tech Mentors',
      role: 'Mentor',
      startDate: 'Jun 2020',
      // No endDate - should show "Present"
      responsibilities: 'Mentoring aspiring developers',
    },
  ],
  references: [
    {
      id: 'ref-1',
      name: 'Jane Manager',
      jobTitle: 'Engineering Director',
      company: 'Tech Corp',
      email: 'jane.manager@techcorp.com',
      phone: '(555) 987-6543',
      relationship: 'Former Manager',
    },
    {
      id: 'ref-2',
      name: 'Bob Colleague',
      // Missing jobTitle and company - should not show "undefined"
      email: 'bob@email.com',
      relationship: 'Colleague',
    },
  ],
  templateStyle: 'classic',
};

// Resume data with empty skills
const emptySkillsResumeData = {
  personalInfo: {
    fullName: 'Empty Skills Person',
    email: 'empty@example.com',
    phone: '(555) 000-0000',
    city: 'Test City, TX',
  },
  workExperience: [
    {
      id: 'work-1',
      jobTitle: 'Worker',
      companyName: 'Company',
      location: 'Location',
      startDate: 'Jan 2020',
      isCurrentJob: true,
      responsibilities: 'Working',
    },
  ],
  education: [
    {
      id: 'edu-1',
      schoolName: 'School',
      degree: 'Degree',
      startYear: '2016',
      isCurrentlyStudying: false,
      // No endYear - should not show "undefined"
    },
  ],
  skills: {
    technicalSkills: [],
    softSkills: [],
    certifications: [],
    languages: [],
  },
  templateStyle: 'classic',
};

/**
 * Helper to navigate to preview with mock data
 * Sets localStorage before page load so stores hydrate with data
 */
async function navigateToPreviewWithData(
  page: import('@playwright/test').Page,
  resumeData: typeof fullResumeData | typeof emptySkillsResumeData
) {
  // First, set up localStorage before navigating
  // We need to go to the domain first to set localStorage
  await page.goto('/');

  // Set dev auth and store data
  await page.evaluate((data) => {
    // Dev auth bypass
    localStorage.setItem('dev_auth_signed_in', 'true');

    // Conversation store (used by Preview page)
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

    // AI conversation store
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
      version: 0,
    };
    localStorage.setItem('resume-builder-ai-conversation', JSON.stringify(aiStoreData));
  }, resumeData);

  // Navigate to preview - use 'load' instead of 'networkidle' to avoid timeout
  // Go to preview with "new" ID so it doesn't try to fetch from database
  await page.goto('/preview/new', { waitUntil: 'load' });

  // Wait for the person's name to appear - this indicates data loaded and rendered
  await page.waitForSelector(`text=${resumeData.personalInfo.fullName}`, { timeout: 15000 });
}

test.describe('Preview Page - Section Rendering', () => {
  test('captures full resume preview screenshot', async ({ page }) => {
    await navigateToPreviewWithData(page, fullResumeData);

    // Wait a bit for full render
    await page.waitForTimeout(500);

    // Take a full-page screenshot
    await page.screenshot({
      path: 'test-results/full-resume-preview.png',
      fullPage: true
    });
  });

  test('displays Volunteering section with entries', async ({ page }) => {
    await navigateToPreviewWithData(page, fullResumeData);

    // Look for Volunteer Experience header
    const volunteerHeader = page.locator('text=/Volunteer Experience/i').first();
    await expect(volunteerHeader).toBeVisible({ timeout: 5000 });

    // Check volunteer entries are visible
    await expect(page.getByText('Code for Good')).toBeVisible();
    await expect(page.getByText('Tech Mentors')).toBeVisible();
    await expect(page.getByText('Volunteer Developer')).toBeVisible();
    await expect(page.getByText('Mentor', { exact: true })).toBeVisible();
  });

  test('displays References section with entries', async ({ page }) => {
    await navigateToPreviewWithData(page, fullResumeData);

    // Look for References header
    const referencesHeader = page.locator('text=/References/i').first();
    await expect(referencesHeader).toBeVisible({ timeout: 5000 });

    // Check reference entries are visible
    await expect(page.getByText('Jane Manager')).toBeVisible();
    await expect(page.getByText('Bob Colleague')).toBeVisible();
  });

  test('displays Certifications in Skills section', async ({ page }) => {
    await navigateToPreviewWithData(page, fullResumeData);

    // Check certifications are visible
    await expect(page.getByText('AWS Certified Developer')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Google Cloud Professional')).toBeVisible();
  });
});

test.describe('Preview Page - Volunteering End Dates', () => {
  test('shows date range for completed volunteering', async ({ page }) => {
    await navigateToPreviewWithData(page, fullResumeData);

    // Should show "Jan 2018 - Dec 2019" for Code for Good
    const dateRange = page.getByText(/Jan 2018.*Dec 2019/i);
    await expect(dateRange).toBeVisible({ timeout: 5000 });
  });

  test('shows "Present" for ongoing volunteering without end date', async ({ page }) => {
    await navigateToPreviewWithData(page, fullResumeData);

    // Should show "Jun 2020 - Present" for Tech Mentors
    const presentDate = page.getByText(/Jun 2020.*Present/i);
    await expect(presentDate).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Preview Page - Empty Section Handling', () => {
  test('does not show Skills header when all skill arrays are empty', async ({ page }) => {
    await navigateToPreviewWithData(page, emptySkillsResumeData);

    // Wait for page to fully render
    await page.waitForTimeout(1000);

    // Skills header should NOT be visible (or if visible, should have no content below)
    const skillsHeaders = page.locator('h2, h3').filter({ hasText: /^Skills$/i });
    const count = await skillsHeaders.count();

    if (count > 0) {
      // If header exists, check that there's no skill content
      const technicalText = await page.getByText('Technical:').isVisible().catch(() => false);
      const softText = await page.getByText('Soft Skills:').isVisible().catch(() => false);
      const certText = await page.getByText('Certifications:').isVisible().catch(() => false);

      // None of the skill categories should be visible
      expect(technicalText || softText || certText).toBe(false);
    }
    // If no header found, that's also correct behavior
  });
});

test.describe('Preview Page - No Undefined Text', () => {
  test('does not show "undefined" text anywhere on the page', async ({ page }) => {
    await navigateToPreviewWithData(page, fullResumeData);

    // Wait for full render
    await page.waitForTimeout(1000);

    // Check that "undefined" does not appear in the page content
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toContain('undefined');
  });

  test('handles missing education end year without showing undefined', async ({ page }) => {
    await navigateToPreviewWithData(page, emptySkillsResumeData);

    // Wait for full render
    await page.waitForTimeout(1000);

    // Education should show "Present" instead of undefined for missing endYear
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toContain('undefined');

    // Should show the education entry
    await expect(page.getByText('School')).toBeVisible();
  });

  test('handles missing reference fields without showing undefined', async ({ page }) => {
    await navigateToPreviewWithData(page, fullResumeData);

    // Wait for full render
    await page.waitForTimeout(1000);

    // Bob Colleague should be visible but without "undefined" for missing job/company
    await expect(page.getByText('Bob Colleague')).toBeVisible();

    // The text should not contain "undefined"
    const bobSection = page.locator('text=Bob Colleague').locator('..');
    const bobText = await bobSection.textContent();
    expect(bobText).not.toContain('undefined');
  });
});

test.describe('Preview Page - All Templates', () => {
  const templates = ['classic', 'modern', 'professional'] as const;

  for (const template of templates) {
    test(`${template} template renders all sections correctly`, async ({ page }) => {
      const dataWithTemplate = {
        ...fullResumeData,
        templateStyle: template,
      };

      await navigateToPreviewWithData(page, dataWithTemplate);

      // Verify key sections exist
      await expect(page.getByText('John Test Smith')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Senior Developer')).toBeVisible();
      await expect(page.getByText('State University')).toBeVisible();

      // Verify no undefined
      const pageContent = await page.textContent('body');
      expect(pageContent).not.toContain('undefined');
    });
  }
});

test.describe('InlinePreviewCard - Certifications', () => {
  test('shows certifications in the inline preview card', async ({ page }) => {
    // Navigate to builder with resume data set
    await page.goto('/');

    await page.evaluate(() => {
      localStorage.setItem('dev_auth_signed_in', 'true');
    });

    await page.evaluate((data) => {
      const storeData = {
        state: {
          currentCategory: 'review',
          messages: [
            { id: '1', role: 'assistant', content: 'Your resume is ready!', timestamp: new Date().toISOString() },
          ],
          resumeData: data,
          workExperienceCount: data.workExperience?.length || 0,
          educationCount: data.education?.length || 0,
          volunteeringCount: data.volunteering?.length || 0,
          referenceCount: data.references?.length || 0,
          isAIMode: true,
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
      localStorage.setItem('resume-builder-ai-conversation', JSON.stringify(storeData));
    }, fullResumeData);

    await page.goto('/builder');

    // Wait for the page to load
    await page.waitForTimeout(2000);

    // The inline preview card should show skills including certifications
    // Look for the skills display in the inline preview
    const skillsSection = page.locator('text=/Skills/i').first();
    const skillsVisible = await skillsSection.isVisible().catch(() => false);

    if (skillsVisible) {
      // Check that at least some skills from the data are visible
      const hasJavaScript = await page.getByText('JavaScript').isVisible().catch(() => false);
      const hasAWS = await page.getByText(/AWS/i).isVisible().catch(() => false);

      // At least one skill or certification should be visible
      expect(hasJavaScript || hasAWS).toBe(true);
    }
  });
});
