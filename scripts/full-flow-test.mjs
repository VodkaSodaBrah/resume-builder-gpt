/**
 * Full E2E test - Enter all resume info through the chat interface
 * Uses the AI conversation mode
 */

import { chromium } from 'playwright';

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
  });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    acceptDownloads: true,
  });
  const page = await context.newPage();

  // Set up dev auth
  await page.goto('http://localhost:3001');
  await page.evaluate(() => {
    localStorage.setItem('dev_auth_signed_in', 'true');
  });

  // Go to builder
  console.log('Starting resume builder...');
  await page.goto('http://localhost:3001/builder');
  await page.waitForTimeout(2000);

  // Helper to type a message and send
  const sendMessage = async (text) => {
    console.log(`  Sending: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    // Wait for input to be enabled (AI finished responding)
    const input = page.locator('textarea:not([disabled]), input[type="text"]:not([disabled])').first();
    await input.waitFor({ state: 'visible', timeout: 60000 });

    // Extra wait for any animations
    await page.waitForTimeout(500);

    await input.click();
    await input.fill(text);
    await page.keyboard.press('Enter');

    // Wait for AI to process (input becomes disabled then enabled again)
    await page.waitForTimeout(1000);
    try {
      // Wait for input to become enabled again (AI finished)
      await page.locator('textarea:not([disabled])').first().waitFor({ state: 'visible', timeout: 30000 });
    } catch {
      // If timeout, continue anyway
    }
    await page.waitForTimeout(500);
  };

  try {
    // The conversation starts with language question
    // Type "English" to select language
    console.log('Selecting language...');
    await sendMessage('English');
    
    // Now it asks for full name
    console.log('Entering personal info...');
    await sendMessage('John Developer Smith');
    
    // Email
    await sendMessage('john.smith@techstartup.com');
    
    // Phone
    await sendMessage('555-123-4567');
    
    // City
    await sendMessage('San Francisco, CA');
    
    // Zip code (might ask this)
    await sendMessage('94102');
    
    // Work experience - yes/no question
    console.log('Entering work experience...');
    await sendMessage('yes');
    
    // Company name
    await sendMessage('Tech Innovations Inc');
    
    // Job title
    await sendMessage('Senior Software Engineer');
    
    // Location
    await sendMessage('San Francisco, CA');
    
    // Start date
    await sendMessage('March 2021');
    
    // Current job?
    await sendMessage('yes');
    
    // Responsibilities
    await sendMessage('Led development of cloud-native microservices architecture serving 5M users. Mentored team of 5 junior developers. Implemented CI/CD pipelines reducing deployment time by 70%. Built real-time analytics dashboard.');
    
    // Another work entry?
    await sendMessage('no');
    
    // Education
    console.log('Entering education...');
    await sendMessage('Stanford University');
    
    await sendMessage("Master's degree");
    
    await sendMessage('Computer Science');
    
    await sendMessage('2017');
    
    await sendMessage('2019');
    
    // Another education?
    await sendMessage('no');
    
    // Volunteering
    console.log('Skipping volunteering...');
    await sendMessage('no');
    
    // Skills
    console.log('Entering skills...');
    await sendMessage('yes'); // technical skills
    
    await sendMessage('Python, JavaScript, TypeScript, Go, Kubernetes, AWS, Docker, PostgreSQL');
    
    await sendMessage('yes'); // soft skills
    
    await sendMessage('Leadership, Team Management, Technical Communication, Problem Solving');
    
    await sendMessage('yes'); // certifications
    
    await sendMessage('AWS Solutions Architect, Kubernetes Administrator CKA');
    
    await sendMessage('yes'); // languages
    
    await sendMessage('English');
    
    await sendMessage('Native');
    
    await sendMessage('no'); // more languages
    
    // References
    console.log('Skipping references...');
    await sendMessage('no');
    
    // Review/Generate
    console.log('Waiting for review stage...');
    await page.waitForTimeout(3000);

    // Try to confirm/generate - say yes to generate
    await sendMessage('yes, generate my resume');
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({ path: 'test-output/flow-complete.png', fullPage: true });
    console.log('Screenshot saved to test-output/flow-complete.png');

    // Look for a generate/create button or link to preview
    const generateBtn = page.locator('button:has-text("Generate"), button:has-text("Create"), button:has-text("Preview"), a:has-text("Preview")').first();
    if (await generateBtn.count() > 0) {
      console.log('Clicking generate/preview button...');
      await generateBtn.click();
      await page.waitForTimeout(5000);
    }

    // Check URL
    let currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // If still on builder, try navigating to preview manually
    if (!currentUrl.includes('/preview')) {
      console.log('Trying to navigate to preview...');
      // Check if there's data to preview
      const hasPreviewCard = await page.locator('text=John Developer Smith').count() > 0;
      if (hasPreviewCard) {
        await page.goto('http://localhost:3001/preview/new');
        await page.waitForTimeout(2000);
        currentUrl = page.url();
      }
    }

    if (currentUrl.includes('/preview')) {
      console.log('On preview page - waiting for content to load...');

      // Take immediate screenshot to debug
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-output/preview-page.png', fullPage: true });
      console.log('Preview screenshot saved');

      // Wait for page to be ready
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2000);

      // Click Modern template - try multiple selectors
      console.log('Selecting Modern template...');
      try {
        // Try clicking the Modern option
        const modernBtn = page.locator('text=Modern').first();
        if (await modernBtn.isVisible()) {
          await modernBtn.click();
        } else {
          // Try finding by partial text
          await page.click('div:has-text("Modern")');
        }
      } catch (e) {
        console.log('Could not click Modern, continuing with default template');
      }
      await page.waitForTimeout(1500);

      // Take screenshot with Modern selected
      await page.screenshot({ path: 'test-output/modern-selected.png', fullPage: true });

      // Download PDF
      console.log('Downloading PDF...');
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 30000 }),
        page.click('text=Download PDF'),
      ]);
      await download.saveAs('test-output/full-flow-resume.pdf');
      console.log('PDF saved to test-output/full-flow-resume.pdf');

      const { exec } = await import('child_process');
      exec('open test-output/full-flow-resume.pdf');
    }

    console.log('\nBrowser open for inspection. Ctrl+C to close.');
    await new Promise(() => {});

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'test-output/flow-error.png', fullPage: true });

    console.log('\nBrowser open for debugging. Ctrl+C to close.');
    await new Promise(() => {});
  }
}

main().catch(console.error);
