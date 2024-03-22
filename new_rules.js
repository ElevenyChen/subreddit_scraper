// Multiple SR version

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { parse } = require('csv-parse');

const readCsvFile = async (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(parse({ columns: true, trim: true })) // Use parse here with the appropriate options
            .on('data', (data) => results.push(data))
            .on('end', () => {
                resolve(results);
            })
            .on('error', reject);
    });
};

(async () => {
    const browser = await chromium.launch({ headless: false });
    const subredditData = await readCsvFile('/Users/ElevenyCHEN/Jupyter/reddit_scraper/selected_SR_list_part_1.csv');

    for (let subreddit of subredditData) {
        const page = await browser.newPage();
        if (subreddit.sr_link && typeof subreddit.sr_link === 'string' && subreddit.sr_link.startsWith('http')) {
            await page.goto(subreddit.sr_link); // Ensure sr_link is a valid URL
        } else {
            console.error(`Invalid URL for subreddit: ${subreddit.sr_name}`);
            continue; // Skip this iteration if the URL is invalid
        }    

        const rulesData = await page.evaluate(() => {
            const data = [];
            // Assuming the rules titles are still correctly captured by the previous logic
            const rulesContainerSelector = "div.-mx-xs.-mt-xs";
            const rulesContainers = document.querySelectorAll(rulesContainerSelector);
            
            rulesContainers.forEach(rulesContainer => {
                // Targeting the specific <h2> element for the rule title
                const rulesTitles = rulesContainer.querySelectorAll("h2.i18n-subreddit-rule-title.flex.text-neutral-content-weak.m-0");
                rulesTitles.forEach((ruleTitle, index) => {
                    const titleText = ruleTitle.textContent.trim();
                    let detailsText = '';
                    
                    // Assuming the rule description follows in a specific <div> related to the title by its proximity
                    const descriptionSelector = `div#-post-rtjson-content.md.px-md`;
                    const descriptions = document.querySelectorAll(descriptionSelector);
                    if (descriptions.length > index) { // Ensure there's a corresponding description for the title
                        detailsText = descriptions[index].textContent.trim();
                    }
                    
                    data.push({ title: titleText, text: detailsText });
                });
            });
            
            return data;
        });

        // Add rules data to the subreddit object
        subreddit.rules = JSON.stringify(rulesData.map(r => r.title));
        subreddit.detailsText = JSON.stringify(rulesData.map(r => r.text));
        subreddit.detailsHTML = JSON.stringify(rulesData.map(r => r.html));

        await page.close();
    }

    await browser.close();

    const filePath = path.join(__dirname, 'selected_rules1.csv.csv');

    const csvWriter = createCsvWriter({
        path: filePath,
        header: [
            // Map original columns from your input file
            {id: 'sr_name', title: 'SR_NAME'},
            {id: 'sr_link', title: 'SR_LINK'},
            // Columns for the scraped data
            {id: 'rules', title: 'RULES'},
            {id: 'detailsText', title: 'DETAIL TEXT'}
        ]
    });
    
    // Ensure subredditData array is correctly populated with all necessary data
    await csvWriter.writeRecords(subredditData)
        .then(() => console.log(`CSV file has been updated and saved to ${filePath}`));
    
})();
