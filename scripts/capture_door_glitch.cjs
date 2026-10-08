const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureDoorOpenState() {
  const screenshotsDir = path.resolve(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2
  });

  try {
    const { exec } = require('child_process');
    const server = exec('npm run preview -- --port 4181', { cwd: path.resolve(__dirname, '..') });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Navigating to local build...');
    await page.goto('http://localhost:4181');
    
    await page.waitForSelector('#btn-begin-intake', { state: 'visible' });
    await page.click('#btn-begin-intake');
    await page.waitForTimeout(1000);
    
    console.log('Opening door and moving camera...');
    await page.evaluate(() => {
        const app = window.__VAULT_APP__;
        if (app && app.scenarioRegistry) {
            const scenario = app.scenarioRegistry.getCurrentScenario();
            if (scenario) {
                // Set GameStage to ACT_1_HUB_CORRIDOR_OPEN to open door
                const bus = app.eventBus;
                bus.emit('game:stage_transition', { to: 1, from: 0 }); // 1 is ACT_1_HUB_CORRIDOR_OPEN
                
                // Move camera to look at the corridor door (which is at z = -6.7)
                app.cameraDirector.resetForScenario({
                    name: 'door_view',
                    position: new window.THREE.Vector3(0, 1.8, -4.0),
                    target: new window.THREE.Vector3(0, 1.8, -7.0)
                });
            }
        }
    });
    
    await page.waitForTimeout(2000); // wait for animation
    
    const screenshotPath = path.join(screenshotsDir, 'corridor_door_open_fixed.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to ${screenshotPath}`);
    
    server.kill();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

captureDoorOpenState();
