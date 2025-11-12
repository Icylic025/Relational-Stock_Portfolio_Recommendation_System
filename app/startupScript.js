// Class for handling initial population of database
const fs = require("fs");
const axios = require("axios");

const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, './.env') });

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

// Sleep function to slow down finnhub request, send 1 request per 2 second
function sleep() {
    return new Promise(resolve => setTimeout(resolve, 5000));
}

// Obtain company profile from finnhub
async function getCompanyProfile(ticker) {
    try {
        const url = `${BASE_URL}/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Finnhub API error:', error.response?.data || error.message);
    }
}

// Reads the ticker and insert the 500 companies
async function initializeWithSP500(func) {
    const tickers = fs.readFileSync("./t.txt", "utf8").split("\n");
    const promises = tickers.map(async (ticker) => {
        await sleep();
        const profile = await getCompanyProfile(ticker);
        if (profile['ticker'] === null) console.log("does not exist " + ticker);
        return func(profile);
    });

    // Wrap insert in try catch for more detailed logging
    try {
        return await Promise.allSettled(promises);
    } catch(err) {
        console.error("Error in initializeWithSP500:", err);
        throw err;
    }
}

module.exports = {
    initializeWithSP500,
};