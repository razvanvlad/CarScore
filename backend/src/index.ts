import express, { Express } from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

const app: Express = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// --- ROOT ROUTE FOR API INFO ---
app.get('/', (req, res) => {
  res.json({
    message: 'CarScore API is running!',
    version: '1.0.0',
    endpoints: {
      analyze: {
        path: '/analyze',
        method: 'POST',
        description: 'Analyze car listings from OLX links',
        requestBody: {
          links: ['array', 'of', 'olx', 'links']
        },
        example: {
          links: [
            'https://www.olx.ro/oferta/audi-a4-1-8-tfsi-2012-cid12345.html',
            'https://www.olx.ro/oferta/vw-golf-2-0-tdi-2015-cid67890.html'
          ]
        }
      }
    },
    status: 'healthy'
  });
});

// --- GEMINI AI SETUP ---
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("FATAL: API_KEY environment variable is not set.");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- SCRAPING LOGIC ---
async function scrapeOlx(url: string): Promise<any> {
  console.log(`Scraping URL: ${url}`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (error) {
    console.error(`Failed to load page ${url}:`, error);
    await browser.close();
    return {
      title: 'Error loading page',
      price: 0,
      year: 0,
      kilometers: 0,
      power: 0,
      fuel: 'Unknown',
      description: 'Failed to load car details'
    };
  }

  try {
    const carData = await page.evaluate(() => {
      // Try to find elements with common OLX selectors
      const title = document.querySelector('h1[data-cy="adPage-title"]')?.textContent?.trim() ||
        document.querySelector('h1.title')?.textContent?.trim() ||
        document.querySelector('h1')?.textContent?.trim() || '';

      const priceElement = document.querySelector('strong[data-cy="adPage-price-value"]') ||
        document.querySelector('.price') ||
        document.querySelector('[class*="price"]');
      const priceText = priceElement?.textContent?.trim() || '0';

      const descriptionElement = document.querySelector('div[data-cy="adPage-description-section"]') ||
        document.querySelector('.description') ||
        document.querySelector('[class*="description"]');
      const description = descriptionElement?.textContent?.trim() || '';

      const details: { [key: string]: string } = {};

      // Try multiple selector patterns for details
      const detailElements = document.querySelectorAll('ul.css-1r0si1e li.css-b5m1rv, .details-list li, .param, [class*="detail"]');

      detailElements.forEach(item => {
        const text = item.textContent || '';
        const separatorIndex = text.indexOf(':');
        if (separatorIndex > -1) {
          const key = text.substring(0, separatorIndex).trim();
          const value = text.substring(separatorIndex + 1).trim();
          if (key && value) {
            details[key] = value;
          }
        }
      });

      return { title, priceText, description, details };
    });

    await browser.close();

    // --- DATA CLEANING ---
    const price = parseInt(carData.priceText.replace(/\D/g, ''), 10) || 0;
    const year = parseInt(carData.details['An de fabricatie'] || carData.details['Anul fabricatiei'] || carData.details['Year'] || '0', 10) || 0;
    const kilometers = parseInt((carData.details['Kilometraj'] || carData.details['Mileage'] || '0').replace(/\D/g, ''), 10) || 0;
    const power = parseInt((carData.details['Putere'] || carData.details['Power'] || '0').replace(/\D/g, ''), 10) || 0;
    const fuel = (carData.details['Combustibil'] || carData.details['Fuel'] || 'Unknown') as 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric';

    return {
      title: carData.title,
      price,
      year,
      kilometers,
      power,
      fuel,
      description: carData.description.substring(0, 4000)
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    await browser.close();
    return {
      title: 'Error scraping page',
      price: 0,
      year: 0,
      kilometers: 0,
      power: 0,
      fuel: 'Unknown',
      description: 'Failed to extract car details'
    };
  }
}

// --- AI ANALYSIS FUNCTION ---
async function analyzeCarDescription(description: string, features: string[], kilometers: number, year: number, fuel: string, transmission: string) {
  try {
    // Create a comprehensive prompt using all available data
    const prompt = `
            You are an expert car analyst. Analyze the following Romanian car listing details:

            Description: "${description}"
            
            Features/Equipment:
            ${features.map(f => `- ${f}`).join('\n')}
            
            Technical Details:
            - Kilometers: ${kilometers.toLocaleString()} km
            - Year: ${year}
            - Fuel: ${fuel}
            - Transmission: ${transmission}
            
            Your task:
            1. Identify potential mechanical defects from this list: [timing_chain, egr, dpf, clutch, suspension, turbo, injectors]
               - Consider: high mileage for age, common problems for this fuel type, specific mentions in description
               - For Diesel: watch for DPF and EGR issues, especially if low mileage or city driving mentioned
               - For high mileage cars (>250,000 km): consider timing chain, turbo, and suspension wear
            
            2. Identify red flags from this list: [accident, odo_rollback, maintenance_issues, high_price, low_price]
               - "accident": Only if description mentions "lovit", "accident", "vopsit", "airbag", "deformat"
               - "odo_rollback": If mileage seems unusually low for the year (e.g., 50,000 km for a 10-year-old car)
               - "maintenance_issues": If description mentions neglected maintenance, missing service history, or major repairs needed
               - "high_price": If price seems significantly higher than market average for this spec
               - "low_price": If price seems suspiciously low (could indicate hidden problems)
            
            3. Assess the overall value and reliability
               - Consider: mileage vs year, maintenance history implications, feature quality, seller reputation
            
            Return ONLY a JSON object with this exact structure:
            {
                "defects": ["defect1", "defect2"],
                "flags": ["flag1", "flag2"],
                "reliabilityScore": 85,
                "valueAssessment": "Good value for money considering the features and condition",
                "highlights": ["feature1", "feature2"],
                "concerns": ["issue1", "issue2"]
            }
            
            Be realistic and conservative in your assessment. Only include defects and flags that are reasonably supported by the data.
        `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 2000
      },
    });

    const response = result.response;
    const text = response.text();

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(text);

      // Validate and sanitize response
      const validDefects = ['timing_chain', 'egr', 'dpf', 'clutch', 'suspension', 'turbo', 'injectors'];
      const validFlags = ['accident', 'odo_rollback', 'maintenance_issues', 'high_price', 'low_price'];

      parsedResponse.defects = Array.isArray(parsedResponse.defects)
        ? parsedResponse.defects.filter((d: string) => validDefects.includes(d.toLowerCase()))
        : [];

      parsedResponse.flags = Array.isArray(parsedResponse.flags)
        ? parsedResponse.flags.filter((f: string) => validFlags.includes(f.toLowerCase()))
        : [];

      parsedResponse.reliabilityScore = Math.max(0, Math.min(100, parseInt(parsedResponse.reliabilityScore) || 70));
      parsedResponse.highlights = Array.isArray(parsedResponse.highlights) ? parsedResponse.highlights : [];
      parsedResponse.concerns = Array.isArray(parsedResponse.concerns) ? parsedResponse.concerns : [];
      parsedResponse.valueAssessment = typeof parsedResponse.valueAssessment === 'string' ? parsedResponse.valueAssessment : 'Reasonable value';

      return parsedResponse;
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      return {
        defects: [],
        flags: [],
        reliabilityScore: 70,
        valueAssessment: 'Unable to assess value',
        highlights: [],
        concerns: []
      };
    }
  } catch (error) {
    console.error('AI analysis failed:', error);
    return {
      defects: [],
      flags: [],
      reliabilityScore: 70,
      valueAssessment: 'Analysis failed',
      highlights: [],
      concerns: []
    };
  }
}

// --- API ENDPOINT ---
app.post('/analyze', async (req: express.Request, res: express.Response) => {
  const { links: rawLinks } = req.body;
  if (!rawLinks || !Array.isArray(rawLinks) || rawLinks.length === 0) {
    return res.status(400).json({ error: 'Please provide an array of links.' });
  }

  const links = rawLinks.filter((link): link is string => typeof link === 'string' && link.trim() !== '');

  if (links.length === 0) {
    return res.status(400).json({ error: 'No valid links provided.' });
  }

  try {
    console.log(`Starting analysis of ${links.length} links...`);
    const analysisPromises = links.map(async (link) => {
      console.log(`Analyzing link: ${link}`);
      const scrapedData = await scrapeOlx(link);

      // Extract relevant data for AI analysis
      const { description, features = [], kilometers, year, fuel, transmission, ...restOfData } = scrapedData;

      // Get comprehensive AI analysis
      const aiAnalysis = await analyzeCarDescription(
        description,
        features,
        kilometers,
        year,
        fuel,
        transmission
      );

      // Price prediction (enhanced with more factors)
      const basePrice = scrapedData.price;
      const ageFactor = Math.max(0.5, 1 - ((new Date().getFullYear() - year) * 0.1));
      const mileageFactor = kilometers > 200000 ? 0.8 : kilometers > 150000 ? 0.85 : 1;
      const conditionFactor = aiAnalysis.flags.includes('accident') || aiAnalysis.flags.includes('maintenance_issues') ? 0.85 : 1;

      const predictedPrice = Math.round(basePrice * ageFactor * mileageFactor * conditionFactor);

      // Enhanced scoring system
      const priceRatio = basePrice / predictedPrice;
      const priceScore = 100 - (Math.abs(priceRatio - 1) * 100);

      const flagPenalties = {
        'accident': 25,
        'odo_rollback': 30,
        'maintenance_issues': 20,
        'high_price': 15,
        'low_price': 10
      };

      const defectPenalties = {
        'timing_chain': 20,
        'egr': 15,
        'dpf': 15,
        'clutch': 10,
        'suspension': 8,
        'turbo': 15,
        'injectors': 12
      };

      let score = 100;
      score -= aiAnalysis.flags.reduce((total: number, flag: string) => total + (flagPenalties[flag as keyof typeof flagPenalties] || 5), 0);
      score -= aiAnalysis.defects.reduce((total: number, defect: string) => total + (defectPenalties[defect as keyof typeof defectPenalties] || 3), 0);
      score = Math.max(0, score);

      // Combine scores
      const finalScore = Math.round((score * 0.7) + (priceScore * 0.3) + (aiAnalysis.reliabilityScore * 0.2));

      return {
        ...restOfData,
        id: link,
        link,
        predictedPrice,
        aiAnalysis,
        priceDeviation: Math.round((basePrice - predictedPrice) / predictedPrice * 100),
        score: Math.min(100, Math.max(0, finalScore))
      };
    });

    const table = await Promise.all(analysisPromises);
    table.sort((a, b) => b.score - a.score);

    console.log('Analysis completed successfully');
    res.json({ winner: table[0], table, timestamp: new Date().toISOString() });

  } catch (error) {
    console.error('An error occurred during analysis:', error);
    res.status(500).json({
      error: 'Failed to analyze cars.',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// --- HEALTH CHECK ENDPOINT ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 CarScore backend running on http://localhost:${port}`);
  console.log(`📋 API Documentation: http://localhost:${port}`);
  console.log(`⚡ Health check: http://localhost:${port}/health`);
  console.log(`🔍 Analysis endpoint: POST http://localhost:${port}/analyze`);
});