# CarScore AI Analyzer

This is a full-stack application using React (with Vite) for the frontend and Node.js (with Express and Puppeteer) for the backend. The backend performs real web scraping to analyze car data.

## Prerequisites

- Node.js (version 18 or higher)
- npm (usually comes with Node.js)
- A valid Gemini API Key.

## How to Run Locally

This project now has two parts: a frontend and a backend server. The `npm run dev` command will start both for you.

### 1. Install Dependencies

There are dependencies for the main project and for the server. Run this command from the **root project folder** to install everything:

```bash
npm install --save-dev concurrently && npm install --prefix server puppeteer express cors
```

### 2. Install Scraping Browser

The backend uses Puppeteer to control a headless browser for scraping. This is a one-time setup step to download a compatible version of Chrome. Run this from the **root project folder**:

```bash
npx puppeteer browsers install chrome
```

### 3. Add Your API Key to the Backend

The API key is now used by the backend server.

- **Create a `.env` file inside the `server` folder.**
- The variable name **must be `API_KEY`**.
- Add your key like this:

```
# Inside server/.env
API_KEY=YOUR_GEMINI_API_KEY_HERE
```

### 4. Start the Application

Run the main dev command from the **root project folder**:

```bash
npm run dev
```

This will:
- Start the Vite frontend server (usually on `http://localhost:5173`).
- Start the Node.js backend server (on `http://localhost:3001`).
- Open your browser to the frontend app.

The application is now running with a real scraping backend!

## Troubleshooting

- **`Cannot connect to the backend` error in the app:** Make sure the backend server started correctly. Check the terminal output for any errors from the `[server]` process.
- **Dependency errors:** If you have issues, try a clean install: delete `node_modules` and `package-lock.json` from both the root folder and the `server` folder, then run `npm install` again in the root.
