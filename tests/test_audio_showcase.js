import { chromium } from 'playwright';
import { startTestServer } from './helpers/testServer.js';

async function runAudioShowcaseAudit() {
  const { baseUrl, close } = await startTestServer();
  console.log(`Audio showcase server running on ${baseUrl}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log('--- Step 1: Navigate to Audio Showcase ---');
    await page.goto(`${baseUrl}/audio_showcase.html`, { waitUntil: 'domcontentloaded' });

    const title = await page.title();
    console.log(`Page title: ${title}`);
    if (!title.includes('Acoustic Calibration Console')) {
      throw new Error(`Unexpected page title: ${title}`);
    }

    console.log('--- Step 2: User Gesture Unlock Subsystem ---');
    const unlockBtn = page.locator('#btn-unlock');
    await unlockBtn.click();
    await page.waitForTimeout(100);

    const btnText = await unlockBtn.textContent();
    console.log(`Unlock button text: ${btnText}`);
    if (!btnText.includes('ONLINE')) {
      throw new Error(`Subsystem did not enter online state: ${btnText}`);
    }

    console.log('--- Step 3: Tactile Foley Soundboard Verification ---');
    const foleyButtons = page.locator('.foley-item .action-btn');
    const foleyCount = await foleyButtons.count();
    console.log(`Found ${foleyCount} action buttons in Foley soundboard`);
    if (foleyCount < 10) {
      throw new Error(`Expected at least 10 foley buttons, got ${foleyCount}`);
    }

    // Trigger first 6 buttons (bundled and synthesis)
    for (let i = 0; i < Math.min(6, foleyCount); i++) {
      await foleyButtons.nth(i).click();
      await page.waitForTimeout(50);
    }
    console.log('Foley buttons triggered without crash.');

    console.log('--- Step 4: Chamber Soundscape Transitions ---');
    const chamberCards = page.locator('.chamber-card');
    const chamberCount = await chamberCards.count();
    console.log(`Found ${chamberCount} chambers in psychological soundscape suite`);
    if (chamberCount !== 8) {
      throw new Error(`Expected 8 chambers, got ${chamberCount}`);
    }

    // Click Chamber 1 (Sterile Chamber)
    await chamberCards.nth(0).click();
    await page.waitForTimeout(100);
    let activeTag = await page.locator('#active-soundscape-tag').textContent();
    console.log(`Active Soundscape: ${activeTag}`);
    if (!activeTag.includes('SL4-04-HUB')) {
      throw new Error(`Expected Chamber 01 active, got ${activeTag}`);
    }

    // Click Chamber 8 (Velvet Lounge)
    await chamberCards.nth(7).click();
    await page.waitForTimeout(100);
    activeTag = await page.locator('#active-soundscape-tag').textContent();
    console.log(`Active Soundscape: ${activeTag}`);
    if (!activeTag.includes('SL4-08-VLX')) {
      throw new Error(`Expected Chamber 08 active, got ${activeTag}`);
    }

    console.log('--- Step 5: Act Progression Tension Slider ---');
    const actSlider = page.locator('#slider-act');
    await actSlider.fill('7');
    await actSlider.dispatchEvent('input');
    await page.waitForTimeout(50);

    const actTitle = await page.locator('#val-act-title').textContent();
    console.log(`Tension Profile Stage: ${actTitle}`);
    if (!actTitle.includes('ACT VIII')) {
      throw new Error(`Expected Act VIII tension, got ${actTitle}`);
    }

    console.log('--- Step 6: Console Error Audit ---');
    if (consoleErrors.length > 0) {
      console.warn(`Browser console errors encountered: ${JSON.stringify(consoleErrors)}`);
    } else {
      console.log('Zero console errors encountered.');
    }

    console.log('SUCCESS: All Audio Showcase browser audit assertions passed.');
  } finally {
    await browser.close();
    close();
  }
}

runAudioShowcaseAudit().catch((err) => {
  console.error('Audio showcase audit failed:', err);
  process.exit(1);
});
