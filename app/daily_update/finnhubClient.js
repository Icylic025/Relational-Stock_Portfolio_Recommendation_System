import axios from 'axios';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the .env from /app/
dotenv.config({ path: path.resolve(__dirname, '../.env') });


const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

/**
 * Fetch latest quote data for ticker
 */
export async function getStockQuote(ticker) {
  try {
    const url = `${BASE_URL}/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`;
    console.log('Using API key:', FINNHUB_API_KEY);
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Finnhub API error:', error.response?.data || error.message);
  }
}
/**
 * Fetch company news between two dates
 */
export async function getCompanyNews(ticker, from, to) {
  const url = `${BASE_URL}/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
  const response = await axios.get(url);
  return response.data;
}