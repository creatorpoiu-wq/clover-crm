const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  await page.goto('http://localhost:3002/gallery/chris-emily', { waitUntil: 'networkidle0' });
  
  // Enter password if needed
  const passwordInput = await page.$('input[type="password"]');
  if (passwordInput) {
    await page.type('input[type="password"]', 'password123'); // Assuming a default, or maybe it doesn't need one
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  }
  
  // Scroll down to the album navigation
  await page.evaluate(() => window.scrollBy(0, 1000));
  
  // Get scroll position before
  const scrollBefore = await page.evaluate(() => window.scrollY);
  console.log('Scroll before click:', scrollBefore);
  
  // Click the second album button
  const buttons = await page.$$('button');
  let funButton = null;
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text === 'FUN') {
      funButton = btn;
      break;
    }
  }
  
  if (funButton) {
    await funButton.click();
    await page.waitForTimeout(500); // Wait for transition
    
    // Get scroll position after
    const scrollAfter = await page.evaluate(() => window.scrollY);
    console.log('Scroll after click:', scrollAfter);
    
    console.log('Difference:', scrollAfter - scrollBefore);
  } else {
    console.log('FUN button not found');
  }
  
  await browser.close();
})();
