import {openBrowser} from "../scraper/browser.js";
import {By, Key, until} from "selenium-webdriver";
import {englishButton, fromFieldXpath, firstFromOptionXpath, toFieldXpath, firstToOptionXpath, dateFieldXpath, searchXpath} from "../scraper/selectors.js";
const url = "https://www.irctc.co.in/nget/train-search";

async function setSearchParameters(driver, fromStation, toStation, date){
    try{
        // set language
        const EnglishButton = await driver.wait(until.elementLocated(By.xpath(englishButton)),5000);
        await EnglishButton.click();

        // fill from station
        const fromField = await driver.wait(until.elementLocated(By.xpath(fromFieldXpath)),10000);
        if(!fromField){
            throw new Error("From field not found");
        }
        await fromField.sendKeys(fromStation);

        // select first from option
        const firstFromOption = await driver.wait(until.elementLocated(By.xpath(firstFromOptionXpath)),5000);
        if(!firstFromOption){
            throw new Error("From station option not found");
        }
        await firstFromOption.click();

        // fill to station
        const toField = await driver.wait(until.elementLocated(By.xpath(toFieldXpath)),10000);
        if(!toField){
            throw new Error("To field not found");
        }
        await toField.sendKeys(toStation);

        // select first to option
        let firstToOption = await driver.wait(until.elementLocated(By.xpath(firstToOptionXpath)),5000);
        await firstToOption.click();

        // set date
        const dateFieldInput = await driver.wait(until.elementLocated(By.xpath(dateFieldXpath)),5000);
        if(!dateFieldInput){
            throw new Error("Date field not found");
        }
        dateFieldInput.click();
        dateFieldInput.sendKeys(Key.CONTROL, "a");
        dateFieldInput.sendKeys(Key.BACK_SPACE);
        dateFieldInput.sendKeys(date);
        dateFieldInput.sendKeys(Key.ESCAPE);

        // click search button
        const searchButton = await driver.wait(until.elementLocated(By.xpath(searchXpath)),5000);
        if(!searchButton){
            throw new Error("Search button not found");
        }
        console.log("All Parameters set. Searching trains....");
        await searchButton.click();

    }

    catch(err){
        console.log("Error while setting search parameters: ", err);
    }
}


async function getResults(driver){
    const resultsXpath = "//div[@class='ng-star-inserted']/div[@class='ng-star-inserted']";
    const results = await driver.wait(async () =>{
        const elements = await driver.findElements(By.xpath(resultsXpath));
        return elements.length > 0 ? elements : null;
    },10000);
    if(!results){
        console.log("No results found");
        return;
    }

    console.log(`Total ${results.length} trains found`);

    
    for(let item of results){
        const trainNameXpath = ".//div[contains(@class, 'train-heading')]/strong";
        const trainNameElement = await item.findElement(By.xpath(trainNameXpath));
        const trainName = await trainNameElement.getText();
        console.log(trainName);

        const DTimeXpath = ".//span[contains(@class, 'time')]/strong";
        const DTimeElement = await item.findElement(By.xpath(DTimeXpath));
        const DTime = await DTimeElement.getText();
        console.log(`Departure Time: ${DTime}`);


    }
}
async function run(){
    const driver = await openBrowser(url);

    if(!driver){
        console.log("Driver not initialized");
        return;
    }
    try{
        console.log("Starting train search automation...");
        await setSearchParameters(driver, "NDLS", "CSTM", "20/10/2026");
        await getResults(driver);
    }
    catch(err){
        console.log("Error during automation", err);
    }
}

run();