const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  await page.goto('http://localhost:3002/gallery/chris-emily/store', { waitUntil: 'networkidle0' });
  const html = await page.content();
  console.log("HTML length:", html.length);
  if (html.includes("This page couldn't load")) {
     console.log("FOUND NEXTJS ERROR SCREEN");
  } else if (html.includes("Loading collection")) {
     console.log("STUCK ON LOADING");
  } else {
     console.log("SEEMS OK");
  }
  await browser.close();
})();
