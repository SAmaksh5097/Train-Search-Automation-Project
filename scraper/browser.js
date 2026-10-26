import {Builder, Browser} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
async function openBrowser(url){
    try{ 
        const options = new chrome.Options();
        options.addArguments("--disable-gpu");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
        const driver = await new Builder().forBrowser(Browser.CHROME).setChromeOptions(options).build();
        await driver.get(url);
        await driver.manage().window().maximize();
        console.log("Browser opened successfully");
        return driver;
    }
    catch(err){
        console.log("Error while opening browser", err);
        return null;
    }
}

export {openBrowser};