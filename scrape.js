// const { chromium } = require('playwright');
// const fs = require('fs');
// const Papa = require('papaparse');

// const csvFilePath = '/Users/ElevenyCHEN/Jupyter/reddit_scraper/SR_list_test.csv';
// const csvFileOutputPath = '/Users/ElevenyCHEN/Jupyter/reddit_scraper/SR_list_test_updated.csv';

// // Function to read and parse CSV file
// async function readCsv(filePath) {
//     const csvData = fs.readFileSync(filePath, 'utf8');
//     return Papa.parse(csvData, { header: true }).data;
// }

// // Function to write data back to CSV
// function writeCsv(filePath, data) {
//     const csv = Papa.unparse(data);
//     fs.writeFileSync(filePath, csv);
// }

// (async () => {
//     const browser = await chromium.launch({ headless: false });
//     const page = await browser.newPage();

//     const subredditData = await readCsv(csvFilePath);

//     for (let i = 0; i < subredditData.length; i++) {
//         const subredditLink = subredditData[i].sr_link;
//         console.log(`Processing: ${subredditLink}`);
//         try {
//             await page.goto(subredditLink, { waitUntil: 'domcontentloaded' });
//             await page.waitForSelector("#subreddit-right-rail__partial > aside > div > shreddit-subreddit-header", { state: 'attached' });

//             // Adjusted to directly use the correct selector and shadow DOM access within page.evaluate
//             const description = await page.evaluate(() => {
//                 const hostElement = document.querySelector("#subreddit-right-rail__partial > aside > div > shreddit-subreddit-header");
//                 if (hostElement && hostElement.shadowRoot) {
//                     const shadowElement = hostElement.shadowRoot.querySelector("#description");
//                     return shadowElement ? shadowElement.textContent.replace(/\s+/g, ' ').trim() : 'Description not found';
//                 }
//                 return 'Host element or shadow root not found';
//             });

//             subredditData[i]['Description'] = description;
//         } catch (e) {
//             console.error(`Failed to scrape ${subredditLink}: ${e.message}`);
//             subredditData[i]['Description'] = 'Failed to scrape';
//         }
//     }

//     await browser.close();
//     writeCsv(csvFileOutputPath, subredditData);
// })();

const { chromium } = require('playwright');
const fs = require('fs');
const Papa = require('papaparse');

const csvFilePath = '/Users/ElevenyCHEN/Jupyter/reddit_scraper/SR_list_test.csv';
const csvFileOutputPath = '/Users/ElevenyCHEN/Jupyter/reddit_scraper/SR_list_test_updated.csv';

// Function to read and parse CSV file
async function readCsv(filePath) {
    const csvData = fs.readFileSync(filePath, 'utf8');
    return Papa.parse(csvData, { header: true }).data;
}

// Function to write data back to CSV
function writeCsv(filePath, data) {
    const csv = Papa.unparse(data);
    fs.writeFileSync(filePath, csv);
}

(async () => {
    const subredditData = await readCsv(csvFilePath);

    for (let i = 0; i < subredditData.length; i++) {
        // Launch and close the browser within the loop
        const browser = await chromium.launch({ headless: false });
        const page = await browser.newPage();

        const subredditLink = subredditData[i].sr_link;
        console.log(`Processing: ${subredditLink}`);
        try {
            await page.goto(subredditLink, { waitUntil: 'domcontentloaded' });
            await page.waitForSelector("#subreddit-right-rail__partial > aside > div > shreddit-subreddit-header", { state: 'attached' });

            // Adjusted to directly use the correct selector and shadow DOM access within page.evaluate
            const description = await page.evaluate(() => {
                const hostElement = document.querySelector("#subreddit-right-rail__partial > aside > div > shreddit-subreddit-header");
                if (hostElement && hostElement.shadowRoot) {
                    const shadowElement = hostElement.shadowRoot.querySelector("#description");
                    return shadowElement ? shadowElement.textContent.replace(/\s+/g, ' ').trim() : 'Description not found';
                }
                return 'Host element or shadow root not found';
            });

            subredditData[i]['Description'] = description;
        } catch (e) {
            console.error(`Failed to scrape ${subredditLink}: ${e.message}`);
            subredditData[i]['Description'] = 'Failed to scrape';
        }

        await browser.close(); // Close the browser after each iteration
    }

    writeCsv(csvFileOutputPath, subredditData);
})();
