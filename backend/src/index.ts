import express, { Express } from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
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

    // Detect if it's Autovit to use appropriate waiting strategy
    const isAutovit = url.includes('autovit');

    if (isAutovit) {
      console.log('Detected Autovit - waiting for client-side content to load...');

      // For Autovit, wait for actual content to be populated (not just elements)
      try {
        // Wait for the page to have actual car data keywords in the body text
        await page.waitForFunction(() => {
          const bodyText = document.body.innerText || '';
          // Check for common Romanian car spec keywords
          const hasCarSpecs =
            bodyText.includes('Kilometraj') ||
            bodyText.includes('Rulaj') ||
            bodyText.includes('Combustibil') ||
            bodyText.includes('Putere') ||
            bodyText.includes('fabricație') ||
            bodyText.includes('Cutie');

          const h1 = document.querySelector('h1');
          const hasTitle = h1 && h1.textContent && h1.textContent.trim().length > 0;

          return hasTitle && hasCarSpecs && bodyText.length > 2000;
        }, { timeout: 20000 });

        console.log('Content loaded successfully for Autovit');
        // Additional wait to ensure all dynamic content is rendered
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (waitError) {
        console.log('Warning: Timeout waiting for Autovit content, proceeding anyway...');
        // If timeout, wait even longer and try anyway
        await new Promise(resolve => setTimeout(resolve, 8000));
      }
    } else {
      // For OLX, the original logic works fine
      try {
        await page.waitForSelector('h1', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (waitError) {
        console.log('Warning: Timeout waiting for selectors, proceeding anyway');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
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
      transmission: 'Unknown',
      color: 'Unknown',
      bodyType: 'Unknown',
      engineSize: '',
      doors: '',
      seats: '',
      vin: '',
      origin: '',
      condition: '',
      description: 'Failed to load car details',
      allDetails: {}
    };
  }

  try {
    const carData = await page.evaluate(() => {
      // Detect if it's Autovit or OLX based on URL
      const isAutovit = window.location.hostname.includes('autovit');

      let title = '';
      let priceText = '0';
      let description = '';
      const details: { [key: string]: string } = {};
      const htmlSample = document.body.innerHTML.substring(0, 5000); // Get first 5000 chars for debug
      const bodyText = document.body.innerText || ''; // Get all visible text

      if (isAutovit) {
        // AUTOVIT SELECTORS - Multiple fallback options for client-side rendered content

        // Title - try multiple selectors
        title = document.querySelector('h1.offer-title')?.textContent?.trim() ||
                document.querySelector('h1[class*="title"]')?.textContent?.trim() ||
                document.querySelector('h1')?.textContent?.trim() ||
                document.querySelector('[data-testid="ad-title"]')?.textContent?.trim() || '';

        // Price - comprehensive selector list
        const priceElement = document.querySelector('span.offer-price__number') ||
                             document.querySelector('[data-testid="price"]') ||
                             document.querySelector('[class*="price"]') ||
                             document.querySelector('h3.offer-price__number') ||
                             document.querySelector('.price-value');
        priceText = priceElement?.textContent?.trim() || '0';

        // Description - multiple selectors
        const descElement = document.querySelector('.offer-description__description') ||
                           document.querySelector('[data-testid="description"]') ||
                           document.querySelector('.offer-description') ||
                           document.querySelector('[class*="description"]');
        description = descElement?.textContent?.trim() || '';

        // Extract parameters from Autovit structure - try multiple patterns
        // Pattern 1: offer-params__item structure
        const paramElements = document.querySelectorAll('li.offer-params__item');
        paramElements.forEach(item => {
          const label = item.querySelector('.offer-params__label')?.textContent?.trim();
          const value = item.querySelector('.offer-params__value')?.textContent?.trim();
          if (label && value) {
            details[label] = value;
          }
        });

        // Pattern 2: data-testid structure
        const altParams = document.querySelectorAll('[data-testid="advert-details-item"]');
        altParams.forEach(item => {
          const text = item.textContent || '';
          const parts = text.split(':');
          if (parts.length === 2) {
            details[parts[0].trim()] = parts[1].trim();
          }
        });

        // Pattern 3: Generic parameter list items
        const genericParams = document.querySelectorAll('ul.parameters li, .parameter-item, [class*="parameter"]');
        genericParams.forEach(item => {
          const text = item.textContent || '';
          if (text.includes(':')) {
            const parts = text.split(':');
            if (parts.length === 2) {
              details[parts[0].trim()] = parts[1].trim();
            }
          }
        });

        // Pattern 4: Try to find any list items with label/value structure
        const allListItems = document.querySelectorAll('li');
        allListItems.forEach(item => {
          const spans = item.querySelectorAll('span');
          if (spans.length === 2) {
            const label = spans[0].textContent?.trim();
            const value = spans[1].textContent?.trim();
            if (label && value && label.length < 50) { // Avoid capturing long text as labels
              details[label] = value;
            }
          }
        });

        // Pattern 5: Text-based extraction from body text as fallback
        // If we still have very few details, try to parse from visible text
        if (Object.keys(details).length < 10) {
          // On Autovit, labels and values are on separate lines
          // Split by newlines and normalize whitespace
          const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

          // Extract year from "Utilizat · 2008" format
          if (!details['An de fabricație'] && !details['Anul']) {
            const yearMatch = bodyText.match(/Utilizat\s*·\s*(\d{4})/i) || bodyText.match(/(\d{4})\s*·\s*Utilizat/i);
            if (yearMatch) {
              details['An de fabricație'] = yearMatch[1];
            }
          }

          // Look for label-value pairs on consecutive lines
          for (let i = 0; i < lines.length - 1; i++) {
            const label = lines[i];
            const value = lines[i + 1];

            // Kilometers - label "Km" followed by value like "272 000 km"
            if (!details['Kilometraj'] && label.match(/^Km$/i)) {
              const kmMatch = value.match(/([\d\s.]+)\s*km/i);
              if (kmMatch) {
                details['Kilometraj'] = kmMatch[1].trim();
              }
            }

            // Engine capacity - "Capacitate cilindrica" followed by "2 993 cm3"
            if (!details['Capacitate cilindrica'] && label.match(/Capacitate\s+cilindr/i)) {
              const ccMatch = value.match(/([\d\s.]+)\s*cm/i);
              if (ccMatch) {
                details['Capacitate cilindrica'] = ccMatch[1].trim() + ' cm³';
              }
            }

            // Power - "Putere" followed by "235 CP"
            if (!details['Putere'] && label.match(/^Putere$/i)) {
              const powerMatch = value.match(/([\d\s]+)\s*(?:CP|HP)/i);
              if (powerMatch) {
                details['Putere'] = powerMatch[1].trim();
              }
            }

            // Fuel - "Combustibil" followed by "Diesel"
            if (!details['Combustibil'] && label.match(/Combustibil/i)) {
              if (value.match(/^(Diesel|Benzina|Petrol|Hybrid|Electric|GPL)$/i)) {
                details['Combustibil'] = value;
              }
            }

            // Transmission - "Cutie de viteze" or "Transmisie" followed by "Automata"
            if (!details['Cutie de viteze'] && !details['Transmisie']) {
              if (label.match(/Cutie\s+(?:de\s+)?viteze|Transmisie/i)) {
                if (value.match(/^(Automat|Manual|Automata)$/i)) {
                  details['Cutie de viteze'] = value;
                }
              }
            }

            // Color - "Culoare" followed by color name
            if (!details['Culoare'] && label.match(/Culoare/i)) {
              if (value.length < 20 && !value.match(/\d/)) { // Simple color name
                details['Culoare'] = value;
              }
            }

            // Body type - "Tip Caroserie" followed by "SUV"
            if (!details['Tip caroserie'] && label.match(/Tip\s+Caroserie/i)) {
              if (value.length < 30) {
                details['Tip caroserie'] = value;
              }
            }
          }
        }

      } else {
        // OLX SELECTORS (original)
        title = document.querySelector('h1[data-cy="adPage-title"]')?.textContent?.trim() ||
                document.querySelector('h1.title')?.textContent?.trim() ||
                document.querySelector('h1')?.textContent?.trim() || '';

        const priceElement = document.querySelector('strong[data-cy="adPage-price-value"]') ||
                             document.querySelector('.price') ||
                             document.querySelector('[class*="price"]');
        priceText = priceElement?.textContent?.trim() || '0';

        const descriptionElement = document.querySelector('div[data-cy="adPage-description-section"]') ||
                                  document.querySelector('.description') ||
                                  document.querySelector('[class*="description"]');
        description = descriptionElement?.textContent?.trim() || '';

        // OLX details
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
      }

      // Debug info: what elements were found
      const debugInfo = {
        foundTitle: !!title,
        foundPrice: !!priceText && priceText !== '0',
        foundDescription: !!description,
        detailsCount: Object.keys(details).length,
        h1Elements: document.querySelectorAll('h1').length,
        allListItems: document.querySelectorAll('li').length,
        hasOfferParams: document.querySelectorAll('li.offer-params__item').length,
        hasDataTestId: document.querySelectorAll('[data-testid]').length,
        // Sample of first few elements for debugging
        firstH1Text: document.querySelector('h1')?.textContent?.trim().substring(0, 100) || 'none',
        bodyTextLength: document.body.innerText?.length || 0,
        bodyTextSample: bodyText.substring(0, 1500) // First 1500 chars of visible text
      };

      return { title, priceText, description, details, htmlSample, debugInfo };
    });

    await browser.close();

    // --- DEBUG: Write scraped data to file ---
    const debugData = {
      url,
      timestamp: new Date().toISOString(),
      rawData: carData,
      detailsKeys: Object.keys(carData.details),
      detailsEntries: carData.details
    };

    const debugFile = path.join(__dirname, '../../scraped-data.md');
    const debugContent = `# Scraped Data Debug - ${new Date().toISOString()}\n\n` +
      `## URL\n${url}\n\n` +
      `## Debug Info\n` +
      `- Found Title: ${carData.debugInfo?.foundTitle}\n` +
      `- Found Price: ${carData.debugInfo?.foundPrice}\n` +
      `- Found Description: ${carData.debugInfo?.foundDescription}\n` +
      `- Details Count: ${carData.debugInfo?.detailsCount}\n` +
      `- H1 Elements: ${carData.debugInfo?.h1Elements}\n` +
      `- All List Items: ${carData.debugInfo?.allListItems}\n` +
      `- Offer Params Items: ${carData.debugInfo?.hasOfferParams}\n` +
      `- Data-testid Elements: ${carData.debugInfo?.hasDataTestId}\n` +
      `- First H1 Text: ${carData.debugInfo?.firstH1Text}\n` +
      `- Body Text Length: ${carData.debugInfo?.bodyTextLength}\n\n` +
      `## Title\n${carData.title || '(empty)'}\n\n` +
      `## Price Text\n${carData.priceText}\n\n` +
      `## Description\n${carData.description || '(empty)'}\n\n` +
      `## Details Object Keys\n${JSON.stringify(Object.keys(carData.details), null, 2)}\n\n` +
      `## All Details\n\`\`\`json\n${JSON.stringify(carData.details, null, 2)}\n\`\`\`\n\n` +
      `## Body Text Sample (first 1500 chars)\n\`\`\`\n${carData.debugInfo?.bodyTextSample || 'N/A'}\n\`\`\`\n\n` +
      `## HTML Sample (first 5000 chars)\n\`\`\`html\n${carData.htmlSample}\n\`\`\`\n\n` +
      `---\n\n`;

    fs.appendFileSync(debugFile, debugContent);
    console.log(`Debug data written to ${debugFile}`);

    // --- DATA CLEANING ---
    const price = parseInt(carData.priceText.replace(/\D/g, ''), 10) || 0;

    // Year - try multiple field names (Autovit and OLX)
    const year = parseInt(
      carData.details['An de fabricație'] ||
      carData.details['An de fabricatie'] ||
      carData.details['Anul fabricației'] ||
      carData.details['Anul fabricatiei'] ||
      carData.details['Anul'] ||
      carData.details['Year'] ||
      '0', 10
    ) || 0;

    // Kilometers
    const kilometers = parseInt((
      carData.details['Kilometraj'] ||
      carData.details['Rulaj'] ||
      carData.details['Mileage'] ||
      '0'
    ).replace(/\D/g, ''), 10) || 0;

    // Power
    const power = parseInt((
      carData.details['Putere'] ||
      carData.details['Putere motor'] ||
      carData.details['Power'] ||
      '0'
    ).replace(/\D/g, ''), 10) || 0;

    // Fuel type
    const fuel = (
      carData.details['Combustibil'] ||
      carData.details['Tip combustibil'] ||
      carData.details['Fuel'] ||
      'Unknown'
    ) as 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric';

    // Transmission
    const transmission =
      carData.details['Cutie de viteze'] ||
      carData.details['Cutie viteze'] ||
      carData.details['Transmisie'] ||
      carData.details['Transmission'] ||
      'Unknown';

    // Color
    const color =
      carData.details['Culoare'] ||
      carData.details['Color'] ||
      'Unknown';

    // Body type
    const bodyType =
      carData.details['Tip caroserie'] ||
      carData.details['Caroserie'] ||
      carData.details['Body type'] ||
      'Unknown';

    // Engine size
    const engineSize =
      carData.details['Capacitate cilindrica'] ||
      carData.details['Capacitate cilindrică'] ||
      carData.details['Capacitate motor'] ||
      carData.details['Engine size'] ||
      '';

    // Doors
    const doors =
      carData.details['Număr uși'] ||
      carData.details['Numar usi'] ||
      carData.details['Doors'] ||
      '';

    // Seats
    const seats =
      carData.details['Număr locuri'] ||
      carData.details['Numar locuri'] ||
      carData.details['Seats'] ||
      '';

    const vin = carData.details['VIN'] || '';

    const origin =
      carData.details['Țară de origine'] ||
      carData.details['Tara de origine'] ||
      carData.details['Country of origin'] ||
      '';

    const condition =
      carData.details['Stare'] ||
      carData.details['Condition'] ||
      '';

    return {
      title: carData.title,
      price,
      year,
      kilometers,
      power,
      fuel,
      transmission,
      color,
      bodyType,
      engineSize,
      doors,
      seats,
      vin,
      origin,
      condition,
      description: carData.description.substring(0, 4000),
      allDetails: carData.details // Include all raw details for reference
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
      transmission: 'Unknown',
      color: 'Unknown',
      bodyType: 'Unknown',
      engineSize: '',
      doors: '',
      seats: '',
      vin: '',
      origin: '',
      condition: '',
      description: 'Failed to extract car details',
      allDetails: {}
    };
  }
}

// --- AI ANALYSIS FUNCTION ---
async function analyzeCarDescription(description: string, features: string[], kilometers: number, year: number, fuel: string, transmission: string) {
  try {
    // Calculate expected mileage range for odometer fraud detection
    const carAge = new Date().getFullYear() - year;
    const avgKmPerYear = 15000; // Average km/year in Europe
    const expectedMinKm = carAge * 8000;  // Low usage: 8k km/year
    const expectedMaxKm = carAge * 20000; // High usage: 20k km/year
    const expectedAvgKm = carAge * avgKmPerYear;

    // Check for verification keywords in description
    const hasVerification = /carvertical|istoric\s+verificat|verificat\s+oficial|raport\s+oficial|documente\s+complete/i.test(description);

    // Create a comprehensive prompt using all available data
    const prompt = `
            You are an expert car analyst specializing in Romanian used car market. Analyze this listing VERY CRITICALLY:

            Description: "${description}"

            Features/Equipment:
            ${features.map(f => `- ${f}`).join('\n')}

            Technical Details:
            - Kilometers: ${kilometers.toLocaleString()} km (Expected range for ${carAge} year old car: ${expectedMinKm.toLocaleString()}-${expectedMaxKm.toLocaleString()} km)
            - Year: ${year}
            - Fuel: ${fuel}
            - Transmission: ${transmission}
            - Has verification documents: ${hasVerification ? 'YES' : 'NO'}

            CRITICAL INSTRUCTIONS - READ CAREFULLY:

            1. DEFECTS - Look for these Romanian keywords and patterns:

               **timing_chain** (CRITICAL - 50 point penalty):
               - "lanț" or "lant" + "distribuție" or "distributie"
               - "rupt", "uzat", "zgomot", "trebuie schimbat", "probleme la lant"
               - Any mention of timing chain issues is CRITICAL

               **egr**: "EGR", "recirculare gaze", "înfundat", "curatat"
               **dpf**: "DPF", "filtru particule", "regenerare", "blocat", "scos"
               **clutch**: "ambreiaj", "ambreiajul", "patinează", "uzat"
               **suspension**: "suspensie", "amortizoare", "zgomote", "bielete"
               **turbo**: "turbo", "turbosuflanta", "pierde putere", "fum albastru"
               **injectors**: "injectoare", "injecție", "ralanti instabil"

            2. RED FLAGS - Be VERY strict:

               **accident**: "lovit", "accident", "vopsit", "airbag", "deformat", "impact", "avariat"

               **odo_rollback** (VERY IMPORTANT):
               - If kilometers (${kilometers}) < ${expectedMinKm} AND no verification mentioned → SUSPICIOUS
               - Average should be ~${expectedAvgKm} km for a ${carAge} year old car
               - Look for: "kilometraj real", "verificat", but DOUBT if no proof

               **maintenance_issues**:
               - "service nefăcut", "întreținere neglijată", "fără istoric"
               - "necesită reparații", "trebuie făcut", "probleme"

               **high_price**: If seller emphasizes "urgent", "preț fix", "fără negociere" but car has issues
               **low_price**: If price seems too good for specs → likely hidden problems

            3. Assess REALISTIC reliability (0-100):
               - Broken/damaged parts = MAX 40
               - Missing verification + low km = MAX 60
               - High mileage (>250k) = MAX 70
               - Perfect condition + verified = 90+

            4. Output format:
            {
                "defects": ["timing_chain", "egr"],  // Only if CLEARLY mentioned
                "flags": ["odo_rollback", "accident"],  // Be strict!
                "reliabilityScore": 45,  // LOW if serious issues
                "valueAssessment": "AVOID - broken timing chain costs €2000+",
                "highlights": ["Full options", "Xenon lights"],
                "concerns": ["Timing chain broken - major repair needed", "Low mileage not verified - possible rollback"]
            }

            BE HARSH. Romanian used car market has many frauds. If something seems off, FLAG IT.
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

      // Enhanced scoring system with REALISTIC penalties
      const priceRatio = basePrice / predictedPrice;
      const priceScore = 100 - (Math.abs(priceRatio - 1) * 100);

      // Calculate mileage-based odometer suspicion
      const carAge = new Date().getFullYear() - year;
      const expectedMinKm = carAge * 8000;
      const avgKmPerYear = kilometers / carAge;
      const hasVerification = description.toLowerCase().includes('carvertical') ||
                             description.toLowerCase().includes('verificat') ||
                             description.toLowerCase().includes('raport oficial');

      // RED FLAGS - Very severe penalties (these are deal-breakers)
      const flagPenalties = {
        'accident': 35,              // Major structural damage
        'odo_rollback': 40,          // Fraud - criminal offense
        'maintenance_issues': 25,    // Unknown reliability
        'high_price': 10,            // Just overpriced
        'low_price': 15              // Usually hiding problems
      };

      // DEFECTS - Realistic repair cost penalties
      const defectPenalties = {
        'timing_chain': 50,   // €2000-3000 repair + potential engine damage = CRITICAL
        'turbo': 30,          // €800-1500 repair
        'dpf': 25,            // €500-1000 repair or removal
        'egr': 20,            // €300-700 repair
        'injectors': 20,      // €400-800 per injector
        'clutch': 15,         // €300-600 repair
        'suspension': 12      // €200-500 repair
      };

      let score = 100;

      // Apply defect penalties
      score -= aiAnalysis.defects.reduce((total: number, defect: string) =>
        total + (defectPenalties[defect as keyof typeof defectPenalties] || 5), 0);

      // Apply flag penalties
      score -= aiAnalysis.flags.reduce((total: number, flag: string) =>
        total + (flagPenalties[flag as keyof typeof flagPenalties] || 5), 0);

      // Additional odometer fraud detection penalty (independent of AI)
      if (kilometers < expectedMinKm && !hasVerification) {
        console.log(`⚠️ Suspicious mileage: ${kilometers} km for ${carAge} year old car (expected min: ${expectedMinKm} km)`);
        score -= 30; // Likely odometer fraud
        if (!aiAnalysis.flags.includes('odo_rollback')) {
          aiAnalysis.flags.push('odo_rollback');
        }
        if (!aiAnalysis.concerns) aiAnalysis.concerns = [];
        aiAnalysis.concerns.push(`Suspiciously low mileage: ${avgKmPerYear.toFixed(0)} km/year (expected 10k-20k km/year)`);
      }

      // Very high mileage penalty
      if (kilometers > 300000) {
        score -= 20; // Significant wear expected
      } else if (kilometers > 250000) {
        score -= 15;
      }

      score = Math.max(0, score);

      // Combine scores - emphasize reliability over price
      const finalScore = Math.round((score * 0.5) + (aiAnalysis.reliabilityScore * 0.35) + (priceScore * 0.15));

      return {
        ...restOfData,
        id: link,
        link,
        description,
        features,
        kilometers,
        year,
        fuel,
        transmission,
        predictedPrice,
        priceDeviation: Math.round((basePrice - predictedPrice) / predictedPrice * 100),
        score: Math.min(100, Math.max(0, finalScore)),
        // Spread aiAnalysis to get defects, flags, etc. at top level
        ...aiAnalysis
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