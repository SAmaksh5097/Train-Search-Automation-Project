import {Builder, By, Browser, Key, until} from "selenium-webdriver";

async function firstTest() {
    try
    {
        const driver = await new Builder().forBrowser(Browser.CHROME).build();
        await driver.get("https://www.irctc.co.in/nget/train-search");

        let title = await driver.getTitle();

        console.log("Name of tab opened is ",title);

        await driver.manage().window().maximize();

        var englishButton = "//button[contains(text(), 'English')]";

        let button = await driver.wait(until.elementLocated(By.xpath(englishButton)),5000);

        if(!button){
            console.log("button not found");
        }
        else{
            await button.click();
        }


        var fromField = "//input[(@aria-label = 'Enter From station. Input is Mandatory.')]";

        let fromButton = await driver.wait(until.elementLocated(By.xpath(fromField)),10000);

        
        await fromButton.sendKeys("NDLS");

        var firstFromOption = "//ul[contains(@class, 'ui-autocomplete-items')]/li[1]";
        
        let fromoption = await driver.wait(until.elementLocated(By.xpath(firstFromOption)),5000);
        await fromoption.click();

        var toField = "//input[(@aria-label = 'Enter To station. Input is Mandatory.')]";

        let toButton = await driver.wait(until.elementLocated(By.xpath(toField)),10000);

        await toButton.sendKeys("knw");
        var firstToOption = "//ul[contains(@class, 'ui-autocomplete-items') and @id='pr_id_2_list']/li[1]"
        
        let tooption = await driver.wait(until.elementLocated(By.xpath(firstToOption)),5000);
        await tooption.click();

        var date = "18/10/2026";
        var dateField = "//input[contains(@class, 'ng-tns-c69-9 ui-inputtext ui-widget ui-state-default ui-corner-all ng-star-inserted')]";
        let dateFieldInput = await driver.wait(until.elementLocated(By.xpath(dateField)),5000);
        dateFieldInput.click();
        dateFieldInput.sendKeys(Key.CONTROL, "a");
        dateFieldInput.sendKeys(Key.BACK_SPACE);
        dateFieldInput.sendKeys(date);
        dateFieldInput.sendKeys(Key.ESCAPE);

        var searchXpath = "//button[contains(text(),'Search Trains')]";
        let searchButton = await driver.wait(until.elementLocated(By.xpath(searchXpath)),5000);
        console.log("Searching trains....");
        await searchButton.click();
    }
    catch (e)
    {
        console.log(e);
    }
    finally
    {
        console.log("done");
        
    }
}

firstTest();