This project implements a database-backed stock market decision support system that assists users in making informed buy and sell decisions. The system stores and manages portfolio and market data in a relational database, enabling structured queries and analytical operations that support investment decision-making.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cd app
   copy .env.template .env
   # Edit .env with your API keys and database credentials
   ```

## Daily Update Script

The update script keeps stock data current by fetching:
- Daily price quotes (Finnhub API)
- Corporate actions: dividends and stock splits (AlphaVantage API)

### Quick Start

Run a manual update (from team_55/ directory):
```bash
node app/daily_update/updateScript.js
```

Test the AlphaVantage API connection:
```bash
node app/testing/testAlphaVantageAPI.js
```

For more details, see [app/daily_update/README.md](app/daily_update/README.md)
