import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('PAGE EXCEPTION:', err.message);
  });

  console.log("Navigating...");
  await page.goto('http://localhost:3000/gallery/test', { waitUntil: 'networkidle0' });
  console.log("Done.");
  
  await browser.close();
})();
