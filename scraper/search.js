import {openBrowser} from "../scraper/browser.js";
import {By, Key, until} from "selenium-webdriver";
import {englishButton, fromFieldXpath, firstFromOptionXpath, toFieldXpath, firstToOptionXpath, dateFieldXpath, searchXpath} from "../scraper/selectors.js";
const url = "https://www.irctc.co.in/nget/train-search";
import {resultsXpath, trainNameXpath, timesXpath, fromStationXpath, toStationXpath, classCardsXpath, classNameXpath} from "../scraper/selectors.js";
import {format} from "../scraper/formatResult.js";
import {writeFile} from "node:fs/promises";
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
    const results = await driver.wait(async () =>{
        const elements = await driver.findElements(By.xpath(resultsXpath));
        return elements.length > 0 ? elements : null;
    },10000);
    if(!results){
        console.log("No results found");
        return [];
    }

    console.log(`Total ${results.length} trains found`);

    const rawResults = [];

    for(let item of results){
        const trainNameElement = await item.findElement(By.xpath(trainNameXpath));
        const trainName = await trainNameElement.getText();
        console.log(trainName);

        
        const timesElements = await item.findElements(By.xpath(timesXpath));

        const times = [];
        for(let t of timesElements){
            const time = await t.getText();
            times.push(time);
        }

        console.log(`Departure: ${times[0]}, Arrival: ${times[1]}`);

        const fromStationElement = await item.findElement(By.xpath(fromStationXpath));
        const fromStationParts = (await fromStationElement.getText()).split("|");
        const fromStation = fromStationParts[1];
        const startingDate = fromStationParts[2];

        console.log(fromStation);
        console.log(startingDate);

        const toStationElement = await item.findElement(By.xpath(toStationXpath));
        const toStationParts = (await toStationElement.getText()).split("|");
        const toStation = toStationParts[1];
        const endingDate = toStationParts[2];

        console.log(toStation);
        console.log(endingDate);
        
        const classes = [];
        const classCards = await item.findElements(By.xpath(classCardsXpath));
        for(let card of classCards){
            const classNameElement = await card.findElement(By.xpath(classNameXpath));
            const className = await classNameElement.getText();
            classes.push(className);
            console.log(className);
        }

        rawResults.push({
            trainName,
            departure: times[0],
            arrival: times[1],
            fromStation,
            startingDate,
            toStation,
            endingDate,
            classes
        });

        console.log("---------------------------------------------------");

    }

    return format(rawResults);
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
        const formattedResults = await getResults(driver);
        await writeFile("results.json", JSON.stringify(formattedResults, null, 2));
        console.log("Results exported to results.json");
        console.log(JSON.stringify(formattedResults, null, 2));
    }
    catch(err){
        console.log("Error during automation", err);
    }
}

run();