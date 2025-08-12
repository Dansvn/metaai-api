const express = require('express');
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const os = require('os');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = 8000;
let driver;

async function wait(startIdx) {
  let lastText = '';
  let sameCount = 0;

  for (let i = 0; i < 60; i++) {
    const msgs = await driver.findElements(By.css('.xe0n8xf.x12d4x0i.x1d5s5ig'));
    const newMsgs = msgs.slice(startIdx);
    const curText = (await Promise.all(newMsgs.map(m => m.getText()))).join('\n').trim();

    console.log(`Iter ${i}: currentText =`, curText);

    if (curText && curText === lastText) {
      sameCount++;
      if (sameCount >= 2) return curText;
    } else {
      lastText = curText;
      sameCount = 0;
    }
    await driver.sleep(1000);
  }
  return lastText || "[!] No final response detected.";
}

async function start() {
  const tmpDir = path.join(os.tmpdir(), 'chrome-profile-' + Date.now());

  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  const options = new chrome.Options();
  options.addArguments(
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-blink-features=AutomationControlled",
    "--enable-unsafe-swiftshader",
    "--log-level=3"
  );

  // Não usa setChromeService pra evitar erro
  driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.get('https://www.meta.ai/');
  await driver.sleep(3000);

  const continueBtn = await driver.wait(
    until.elementLocated(By.xpath("//span[contains(text(),'Continue without logging in')]")),
    10000
  );
  await driver.executeScript("arguments[0].scrollIntoView(true);", continueBtn);
  await driver.sleep(500);
  await continueBtn.click();

  const yearDropdown = await driver.wait(
    until.elementLocated(By.xpath("//span[text()='Year']")),
    10000
  );
  await driver.executeScript("arguments[0].scrollIntoView(true);", yearDropdown);
  await driver.sleep(500);
  await yearDropdown.click();

  const year2000 = await driver.wait(
    until.elementLocated(By.xpath("//span[text()='2000']")),
    10000
  );
  await driver.executeScript("arguments[0].scrollIntoView(true);", year2000);
  await driver.sleep(500);
  await year2000.click();

  const continueFinalBtn = await driver.wait(
    until.elementLocated(By.xpath("//span[text()='Continue']")),
    10000
  );
  await driver.executeScript("arguments[0].scrollIntoView(true);", continueFinalBtn);
  await driver.sleep(500);
  await continueFinalBtn.click();

  console.log("Initial flow completed. Browser ready.");
}

app.post('/question', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      console.log("Request without 'question' field received.");
      return res.status(400).json({ error: "'question' field is required" });
    }

    console.log("Question received:", question);

    const msgsBefore = await driver.findElements(By.css('.xe0n8xf.x12d4x0i.x1d5s5ig'));
    console.log("Messages before sending:", msgsBefore.length);
    const startIdx = msgsBefore.length;

    const editor = await driver.findElement(By.css('[contenteditable="true"]'));
    await editor.click();
    await editor.sendKeys(question, Key.ENTER);

    const finalAnswer = await wait(startIdx);
    console.log("Final response:", finalAnswer);

    res.json({ answer: finalAnswer });
  } catch (err) {
    console.error("Error sending question:", err);
    res.status(500).json({ error: err.message });
  }
});

(async () => {
  await start();
  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
})();
