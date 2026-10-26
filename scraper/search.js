import {openBrowser} from "../scraper/browser.js";
import {By, Key, until} from "selenium-webdriver";
import {englishButton, fromFieldXpath, firstFromOptionXpath, toFieldXpath, firstToOptionXpath, dateFieldXpath, searchXpath} from "../scraper/selectors.js";
const url = "https://www.irctc.co.in/nget/train-search";
import {resultsXpath, trainNameXpath, timesXpath, fromStationXpath, toStationXpath, classCardsXpath, classNameXpath} from "../scraper/selectors.js";
import {format} from "../scraper/formatResult.js";
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
        await dateFieldInput.click();
        await dateFieldInput.sendKeys(Key.CONTROL, "a");
        await dateFieldInput.sendKeys(Key.BACK_SPACE);
        await dateFieldInput.sendKeys(date);
        await dateFieldInput.sendKeys(Key.ESCAPE);

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
        throw err;
    }
}


async function getResults(driver){
    const results = await driver.wait(async () =>{
        const elements = await driver.findElements(By.xpath(resultsXpath));
        return elements.length > 0 ? elements : null;
    },30000);
    if(!results){
        console.log("No results found");
        return [];
    }

    console.log(`Total ${results.length} trains found`);

    const rawResults = [];

    for(let item of results){
        const trainNameElement = await item.findElement(By.xpath(trainNameXpath));
        const trainName = await trainNameElement.getText();

        
        const timesElements = await item.findElements(By.xpath(timesXpath));

        const times = [];
        for(let t of timesElements){
            const time = await t.getText();
            times.push(time);
        }


        const fromStationElement = await item.findElement(By.xpath(fromStationXpath));
        const fromStationParts = (await fromStationElement.getText()).split("|");
        const fromStation = fromStationParts[1];
        const startingDate = fromStationParts[2];

        const toStationElement = await item.findElement(By.xpath(toStationXpath));
        const toStationParts = (await toStationElement.getText()).split("|");
        const toStation = toStationParts[1];
        const endingDate = toStationParts[2];

        const classes = [];
        const classCards = await item.findElements(By.xpath(classCardsXpath));
        for(let card of classCards){
            const classNameElement = await card.findElement(By.xpath(classNameXpath));
            const className = await classNameElement.getText();
            classes.push(className);
        }

        rawResults.push({
            trainName,
            departure: times[0].replace(/\|/g, '').trim(),
            arrival: times[1].replace(/\|/g, '').trim(),
            fromStation,
            startingDate,
            toStation,
            endingDate,
            classes
        });

    }

    return format(rawResults);
}
export async function run({from, to, date}){
    const driver = await openBrowser(url);

    if(!driver){
        console.log("Driver not initialized");
        return;
    }
    try{
        console.log("Starting train search automation...");
        await setSearchParameters(driver, from, to, date);
        const formattedResults = await getResults(driver);
        return formattedResults;
        // console.log(JSON.stringify(formattedResults, null, 2));
    }
    catch(err){
        console.log("Error during automation", err);
        throw err;
    }
}

// run({from: "New Delhi (NDLS)", to: "Khandwa Junction (KNW)", date: "12/12/2026"});