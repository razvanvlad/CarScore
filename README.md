# CarScore AI Analyzer

A full-stack car listing analyzer that uses AI to evaluate car listings from OLX Romania. The application scrapes car data using Puppeteer, analyzes it with Google's Gemini AI, and provides comprehensive scoring based on defects, red flags, and value assessment.

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- html2canvas for screenshot functionality

### Backend
- Node.js with Express
- TypeScript
- Puppeteer for web scraping
- Google Generative AI (Gemini 1.5 Flash)
- dotenv for environment management

## Prerequisites

- Node.js (version 18 or higher)
- npm (usually comes with Node.js)
- A valid Google Gemini API Key

## Initial Setup

### 1. Install Dependencies

Install dependencies for both frontend and backend:

```bash
# Root directory (frontend dependencies)
npm install

# Backend dependencies
cd backend
npm install
cd ..
```

### 2. Install Puppeteer Browser

Puppeteer requires a compatible Chrome browser. This is a one-time setup:

```bash
npx puppeteer browsers install chrome
```

### 3. Configure Environment Variables

Create a `.env` file in the **backend** folder:

```bash
# backend/.env
API_KEY=YOUR_GEMINI_API_KEY_HERE
```

## Running the Application

### Standard Start

```bash
# Terminal 1 - Backend Server
npm run dev:backend

# Terminal 2 - Frontend Development Server
npm run dev:frontend
```

### How to Restart Properly

If you need to restart the application with clean cache:

```bash
# Terminal 1 (Backend - keep running)
npm run dev:backend

# Terminal 2 (Frontend - restart with clean cache)
npm run dev:frontend -- --force
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

## API Endpoints

### Root Endpoint
```
GET /
```
Returns API information and available endpoints.

### Analyze Cars
```
POST /analyze
```
Analyzes car listings from OLX links.

**Request Body:**
```json
{
  "links": [
    "https://www.olx.ro/oferta/...",
    "https://www.olx.ro/oferta/..."
  ]
}
```

**Response:**
```json
{
  "winner": { /* Best scoring car */ },
  "table": [ /* All analyzed cars sorted by score */ ],
  "timestamp": "2025-11-04T..."
}
```

### Health Check
```
GET /health
```
Returns server status and uptime.

## Features

### AI Analysis
The app uses Gemini AI to identify:
- **Mechanical Defects**: timing chain, EGR, DPF, clutch, suspension, turbo, injectors
- **Red Flags**: accident history, odometer rollback, maintenance issues, pricing anomalies
- **Reliability Score**: 0-100 based on overall condition
- **Value Assessment**: Whether the car is good value for money

### Scoring System
Cars are scored based on:
- Price deviation from predicted value (30% weight)
- Mechanical defects and their severity (penalty-based)
- Red flags and their severity (penalty-based)
- AI reliability assessment (20% weight)

### Data Extracted
- Title
- Price
- Year of manufacture
- Kilometers/Mileage
- Engine power
- Fuel type
- Full description
- Features and equipment

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   └── index.ts          # Backend server & scraping logic
│   ├── package.json
│   └── .env                   # API key configuration
├── src/                       # Frontend React components
├── package.json               # Root package.json
├── vite.config.ts            # Vite configuration
└── README.md
```

## Troubleshooting

### Backend Connection Issues
- Ensure the backend server started correctly on port 3001
- Check the terminal output for any errors
- Verify the API_KEY is set in `backend/.env`

### Scraping Failures
- OLX may have changed their HTML structure
- Check for rate limiting or IP blocking
- Ensure Puppeteer browser is installed correctly

### Dependency Issues
Clean install if you encounter problems:
```bash
# Remove node_modules and lock files
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json

# Reinstall
npm install
cd backend && npm install
```

### TypeScript Errors
Make sure all dependencies are installed and TypeScript version is compatible:
```bash
npm install typescript@^5.9.3 --save-dev
```

## Development Notes

- The backend uses TypeScript with strict type checking
- Puppeteer runs in headless mode for performance
- AI responses are cached to reduce API calls
- Frontend uses Vite's hot module replacement for fast development

## Build for Production

```bash
npm run build
```

This will create an optimized production build in the `dist` folder.
