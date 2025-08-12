const express = require('express');
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const os = require('os');
const path = require('path');

const app = express();
app.use(express.json());

let driver;

async function wait(startIndex) {
  let ultimotxt = '';
  let igual = 0;

  for (let i = 0; i < 60; i++) { 
    let respostas = await driver.findElements(By.css('.xe0n8xf.x12d4x0i.x1d5s5ig'));
    let novas = respostas.slice(startIndex);
    let txtatual = (await Promise.all(novas.map(r => r.getText()))).join('\n').trim();

    if (txtatual && txtatual === ultimotxt) {
      igual++;
      if (igual >= 2) return txtatual;
    } else {
      ultimotxt = txtatual;
      igual = 0;
    }
    await driver.sleep(1000);
  }
  return ultimotxt || "No answers";
}

async function iniciarNavegador() {
  const tmpDir = path.join(os.tmpdir(), 'chrome-profile-' + Date.now());

  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

const options = new chrome.Options();
options.addArguments(
  "--headless",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-blink-features=AutomationControlled"
);


  driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.get('https://www.meta.ai/');
  await driver.sleep(3000);

  const withoutlogin = await driver.wait(
    until.elementLocated(By.xpath("//span[contains(text(),'Continue without logging in')]")),
    10000
  );
  await driver.executeScript("arguments[0].scrollIntoView(true);", withoutlogin);
  await driver.sleep(500);
  await withoutlogin.click();

  const year = await driver.wait(
    until.elementLocated(By.xpath("//span[text()='Year']")),
    10000
  );
  await driver.executeScript("arguments[0].scrollIntoView(true);", year);
  await driver.sleep(500);
  await year.click();

  const year2000 = await driver.wait(
    until.elementLocated(By.xpath("//span[text()='2000']")),
    10000
  );
  await driver.executeScript("arguments[0].scrollIntoView(true);", year2000);
  await driver.sleep(500);
  await year2000.click();

  const continuebtn = await driver.wait(
    until.elementLocated(By.xpath("//span[text()='Continue']")),
    10000
  );
  await driver.executeScript("arguments[0].scrollIntoView(true);", continuebtn);
  await driver.sleep(500);
  await continuebtn.click();

  console.log("Initial flow completed. Browser ready to send messages.");
}

app.post('/msg', async (req, res) => {
  try {
    const { pergunta } = req.body;
    if (!pergunta) {
      return res.status(400).json({ error: "Missing question field" });
    }

    let respostasAntes = await driver.findElements(By.css('.xe0n8xf.x12d4x0i.x1d5s5ig'));
    let startIndex = respostasAntes.length;

    const editor = await driver.findElement(By.css('[contenteditable="true"]'));
    await editor.click();
    await editor.sendKeys(pergunta, Key.ENTER);

    const respostaFinal = await wait(startIndex);
    res.json({ resposta: respostaFinal });
  } catch (err) {
    console.error("Erro ao enviar pergunta:", err);
    res.status(500).json({ error: err.message });
  }
});

(async () => {
  await iniciarNavegador();
  app.listen(8080, () => {
    console.log("API rodando na porta 8080");
  });
})();
