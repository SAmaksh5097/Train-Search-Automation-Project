import { run } from "./scraper/search.js";
import { collectJourneyDetails } from "./llm/agent.js";
async function main() {
    try {
        console.log("Collecting journey details...");

        const details = await collectJourneyDetails();

        const journeyDetails = {
            from: String(details.from).trim(),
            to: String(details.to).trim(),
            date: String(details.date).trim()
        };

        console.log("Agent completed.");
        console.log("Starting Selenium with:", journeyDetails);

        const results = await run(journeyDetails);

        console.log(JSON.stringify(results, null, 2));
    } catch (error) {
        console.error("Automation failed:", error);
        process.exitCode = 1;
    }
}

main();