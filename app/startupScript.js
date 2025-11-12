// Class for handling initial population of database
const fs = require("fs");
const axios = require("axios");

const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, './.env') });

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';
const CHUNK = 30; // max requests finnhub API request per batch
const WAIT_TIME = 35000; // cooldown time before sending the next batch

// Obtain company profile from finnhub
async function getCompanyProfile(ticker) {
    try {
        const url = `${BASE_URL}/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Finnhub API:', ticker, error.response?.status ?? 'unknown');
        return null;
    }
}

// Reads the ticker and insert the 500 companies
async function initializeWithSP500(func) {
    const tickers = fs.readFileSync("./SP500Ticker.txt", "utf8").split("\n");
    let rejected = false;

    for (let i = 0; i < tickers.length; i += CHUNK) {
        const chunk = tickers.slice(i, i + CHUNK);
        const startTime = Date.now();

        const promises = chunk.map(async ticker => {
            const profile = await getCompanyProfile(ticker);
            if (profile) return func(profile);
            return null;
        });

        try {
            const results = await Promise.allSettled(promises);
            if (!rejected) {
                rejected = results.filter((elem) => {
                    return elem.status === "rejected";
                }).length !== 0;
            }
        } catch (e) {
            rejected = true;
        }

        // Sleep function to slow down finnhub request so its within rate (rate: 60/min, 30/sec)
        const elapsed = Date.now() - startTime;
        const remaining = WAIT_TIME - elapsed;
        if (remaining > 0 && i + CHUNK < tickers.length) {
            console.log(`Waiting ${Math.ceil(remaining/1000)}s before next batch...`);
            await new Promise(resolve => setTimeout(resolve, remaining));
        }
    }
    return rejected;
}

module.exports = {
    initializeWithSP500,
};