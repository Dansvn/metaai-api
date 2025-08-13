# Meta AI Chat API with Selenium

A simple API that lets you send questions to [Meta AI](https://www.meta.ai/) and receive responses automatically.  
Built using `express` and `selenium-webdriver` with Chrome in headless mode.

---

## Features

- Automatically opens Meta AI, bypasses login prompt.
- Sends any question and waits for the full response.
- Works in **headless** or **non-headless** Chrome mode.
- Simple HTTP POST endpoint to interact programmatically.
- Returns the bot's answer as JSON.

---

## Requirements

- **Node.js** 18+ installed.
- **Google Chrome** or **Chromium** installed.
- **ChromeDriver** compatible with your browser version.
- Internet connection.

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/Dansvn/metaai-api
cd metaai-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install Google Chrome or Chromium

- **Windows:** [Download Chrome](https://www.google.com/chrome/)
- **Linux (Debian/Ubuntu):**
```bash
sudo apt install chromium-browser
```

Make sure `chromedriver` matches your browser version.  
You can check your Chrome version with:
```bash
google-chrome --version
```

---

## Running the API

```bash
node index.js
```

If successful, you'll see:

```
Initial flow completed. Browser ready.
API running on port 5000
```

---

## API Usage

### Endpoint: `POST /question`

**Request:**
```bash
curl -X POST http://localhost:5000/question -H "Content-Type: application/json" -d "{\"question\":\"Hi, who are you?\"}"
```

<img width="1262" height="185" alt="image" src="https://github.com/user-attachments/assets/e1574873-408e-4b8f-bb62-1446b95ecaff" />


**Expected response:**
```json
{
  "answer":"Hi, I'm Meta AI, your friendly AI assistant."
}
```

---

## Configuration

You can run in **non-headless mode** (to see the browser actions) by editing in `index.js`:

```js
options.addArguments("--headless=new"); // Remove or comment this line
```

---

## How It Works

1. Opens Meta AI in a Selenium-controlled Chrome browser.
2. Clicks "Continue without logging in".
3. Selects birth year (required by Meta AI).
4. Waits for page to be ready.
5. On each POST request:
   - Sends your question to the chat.
   - Waits until the answer stops updating.
   - Returns the full response in JSON.

---

## Disclaimer

This project is for **educational purposes** only.  
Meta AI's interface may change at any time, breaking the script.

---

## Contact

If you have any questions or need support, feel free to reach out!  
**My social links:** [ayo.so/dansvn](https://ayo.so/dansvn)
