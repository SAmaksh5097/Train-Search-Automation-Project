import {Builder, Browser} from 'selenium-webdriver';

async function openBrowser(url){
    try{
        const driver = await new Builder().forBrowser(Browser.CHROME).build();
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