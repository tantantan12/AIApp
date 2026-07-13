const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.route('**/.netlify/functions/fetchAI', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ reply: { choices: [{ text: "Stay refreshed all day with our extra-large water bottle, built for the Texas heat and made for SMU students on the go." }] } })
    });
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.fill('#name', 'Water Bottle');
  await page.fill('#desc', 'Extra big water bottle to cope with the Texas heat');
  await page.fill('#target', 'College students who go to SMU');
  await page.click('#advertising-btn');
  await page.waitForSelector('#ad-output p');
  await page.screenshot({ path: '_verify3.png' });
  await browser.close();
})();
