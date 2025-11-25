import dotenv from 'dotenv';
import cron from 'node-cron';
import { updatePriceHistory, updateDividends, updateStockSplits } from './updateLogic.js';
import * as appService from '../appService.cjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Read from environment variable, defaults to false for manual mode
const ENABLE_SCHEDULED_UPDATES = process.env.RUN_SCHEDULED === 'true';
const SCHEDULE_EXPRESSION = '0 17 * * 1-5'; // 5 PM on weekdays (Mon-Fri)

// Parse command line arguments for manual mode
// Usage: node updateScript.js --type=dividend|split|both
const args = process.argv.slice(2);
const typeArg = args.find(arg => arg.startsWith('--type='));
const updateType = typeArg ? typeArg.split('=')[1] : 'both'; // Default: both

/**
 * Runs update functions based on the specified type
 * @param {string} type - 'dividend', 'split', or 'both'
 * @param {boolean} isScheduled - Whether this is running in scheduled mode
 */
async function runUpdate(type = 'both', isScheduled = false) {
  const today = new Date();
  const dayOfMonth = today.getDate();

  // In scheduled mode, alternate based on odd/even day
  if (isScheduled) {
    if (dayOfMonth % 2 === 1) {
      type = 'dividend';
      console.log(`=== Scheduled update (Day ${dayOfMonth} - ODD: Dividends) ===`);
    } else {
      type = 'split';
      console.log(`=== Scheduled update (Day ${dayOfMonth} - EVEN: Stock Splits) ===`);
    }
  } else {
    console.log(`=== Manual update (Type: ${type}) ===`);
  }

  await appService.poolReady;

  try {
    // Always update price history (uses Finnhub, not AlphaVantage)
    console.log("\n[1/X] Updating price history...");
    await updatePriceHistory();
    console.log("Price history update completed");

    // Update corporate actions based on type
    if (type === 'dividend' || type === 'both') {
      console.log("\n[2/X] Updating dividends...");
      await updateDividends();
      console.log("Dividend update completed");
    }

    if (type === 'split' || type === 'both') {
      console.log("\n[3/X] Updating stock splits...");
      await updateStockSplits();
      console.log("Stock split update completed");
    }

    console.log("\n=== Update finished successfully ===");
  } catch (err) {
    console.error("Update failed:", err);
    throw err;
  } finally {
    const oracledb = (await import('oracledb')).default;
    try {
      await oracledb.getPool().close(5);
      console.log("Pool closed");
    } catch (err) {
      console.error("Error closing pool:", err);
    }
  }
}


///////////////////// UNDTESTED ///////////////////////////////

/**
 * Sets up scheduled updates using cron
 * Alternates between dividend and stock split updates on odd/even days
 */
function setupScheduledUpdates() {
  console.log(`Scheduled updates enabled: ${SCHEDULE_EXPRESSION}`);
  console.log(`   Next run: 5 PM on weekdays (Mon-Fri)`);
  console.log(`   Strategy: ODD days = Dividends, EVEN days = Stock Splits`);

  cron.schedule(SCHEDULE_EXPRESSION, async () => {
    console.log(`\n[${new Date().toISOString()}] Running scheduled update...`);
    try {
      await runUpdate('both', true); // Pass true for isScheduled
    } catch (err) {
      console.error("Scheduled update failed:", err);
    }
  });

  console.log("Scheduler is running. Press Ctrl+C to stop.\n");
  // Keep the process alive
  process.stdin.resume();
}

// Main execution
if (ENABLE_SCHEDULED_UPDATES) {
  // Scheduled mode: set up cron job with alternating updates
  setupScheduledUpdates();
} else {
  // Manual mode: run once and exit
  // Validate updateType
  if (!['dividend', 'split', 'both'].includes(updateType)) {
    console.error(`Invalid --type argument: ${updateType}`);
    console.error('Valid options: dividend, split, both');
    process.exit(1);
  }

  console.log("Running in manual mode (set RUN_SCHEDULED=true in .env for automated mode)");
  console.log("Usage: node updateScript.js --type=dividend|split|both\n");
  runUpdate(updateType, false);
}
