import { AnalysisResult, CarData } from '../types';

export async function analyzeCars(links: string[]): Promise<AnalysisResult> {
  if (!links || !Array.isArray(links) || links.length === 0) {
    throw new Error('Please provide at least one car listing URL');
  }

  const validLinks = links.filter(link =>
    typeof link === 'string' &&
    link.trim().length > 0 &&
    (link.startsWith('http://') || link.startsWith('https://'))
  );

  if (validLinks.length === 0) {
    throw new Error('No valid URLs provided');
  }

  try {
    // CORRECT VITE ENVIRONMENT VARIABLE USAGE
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

    const response = await fetch(`${baseUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ links: validLinks }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (errorData?.error) {
        throw new Error(errorData.error);
      }
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result || !result.winner || !Array.isArray(result.table)) {
      throw new Error('Invalid API response format');
    }

    return result as AnalysisResult;

  } catch (error) {
    console.error('Car analysis service error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Could not connect to the CarScore backend. Please make sure the server is running.');
      }
      if (error.message.includes('API request failed')) {
        throw new Error('The backend server returned an error. Please try again later.');
      }
      throw new Error(`Analysis failed: ${error.message}`);
    }

    throw new Error('An unexpected error occurred during car analysis');
  }
}

// THIS IS THE MISSING FUNCTION
export async function checkBackendHealth(): Promise<boolean> {
  try {
    // CORRECT VITE ENVIRONMENT VARIABLE USAGE
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

// OPTIONAL: API info function
export async function getApiInfo(): Promise<any> {
  try {
    // CORRECT VITE ENVIRONMENT VARIABLE USAGE
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const response = await fetch(`${baseUrl}/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get API info: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get API info:', error);
    throw new Error('Could not retrieve API information');
  }
}