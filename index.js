const express = require('express');
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = 5000;

const app = express();
app.use(express.json());

let driver;

async function waitAnswer(fromIndex) {
  let lastMessage = '';
  let stableCount = 0;

  for (let i = 0; i < 60; i++) {
    let messages = await driver.findElements(By.css('.xe0n8xf.x12d4x0i.x1d5s5ig'));
    let newMessages = messages.slice(fromIndex);
    let text = (await Promise.all(newMessages.map(m => m.getText()))).join('\n').trim();

    if (text && text === lastMessage) {
      stableCount++;
      if (stableCount >= 2) return text;
    } else {
      lastMessage = text;
      stableCount = 0;
    }
    await driver.sleep(1000);
  }
  return lastMessage || "No answer detected.";
}

async function startBrowser() {
  const profileDir = path.join(os.tmpdir(), 'chrome-profile-' + Date.now());
  if (fs.existsSync(profileDir)) {
    fs.rmSync(profileDir, { recursive: true, force: true });
  }

  const options = new chrome.Options();
  options.addArguments(
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-blink-features=AutomationControlled'
  );

  driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.get('https://www.meta.ai/');
  await driver.sleep(3000);

  const btnContinue = await driver.wait(
    until.elementLocated(By.xpath("//span[contains(text(),'Continue without logging in')]")),
    10000
  );
  await driver.executeScript("arguments[0].scrollIntoView(true);", btnContinue);
  await driver.sleep(500);
  await btnContinue.click();

  const dropdownYear = await driver.wait(
    until.elementLocated(By.xpath("//span[text()='Year']")),
    10000
  );
  await driver.executeScript("arguments[0].scrollIntoView(true);", dropdownYear);
  await driver.sleep(500);
  await dropdownYear.click();

  const year2000 = await driver.wait(
    until.elementLocated(By.xpath("//span[text()='2000']")),
    10000
  );
  await driver.executeScript("arguments[0].scrollIntoView(true);", year2000);
  await driver.sleep(500);
  await year2000.click();

  const btnFinalContinue = await driver.wait(
    until.elementLocated(By.xpath("//span[text()='Continue']")),
    10000
  );
  await driver.executeScript("arguments[0].scrollIntoView(true);", btnFinalContinue);
  await driver.sleep(500);
  await btnFinalContinue.click();

  console.log('Browser ready for questions.');
}

app.post('/question', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Question is required." });

    const oldMessages = await driver.findElements(By.css('.xe0n8xf.x12d4x0i.x1d5s5ig'));
    const fromIndex = oldMessages.length;

    const input = await driver.findElement(By.css('[contenteditable="true"]'));
    await input.click();
    await input.sendKeys(question, Key.ENTER);

    const answer = await waitAnswer(fromIndex);
    res.json({ answer });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

(async () => {
  await startBrowser();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
