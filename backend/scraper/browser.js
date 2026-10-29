import {Builder, Browser} from "selenium-webdriver";
import chrome from 'selenium-webdriver/chrome.js';

async function openBrowser(url) {
    const options = new chrome.Options();
    options.addArguments(
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--window-size=1920,1080",
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    );

    if (process.env.CHROME_BIN) {
        options.setChromeBinaryPath(process.env.CHROME_BIN);
    }

    try {
        const driver = await new Builder()
            .forBrowser(Browser.CHROME)
            .setChromeOptions(options)
            .build();
        await driver.get(url);
        console.log("Browser opened successfully");
        return driver;
    } catch (error) {
        console.error("Error while opening browser:", error);
        throw new Error("Unable to start Chrome for train search.", {
            cause: error,
        });
    }
}

export {openBrowser};