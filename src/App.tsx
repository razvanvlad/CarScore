import React, { useState } from 'react';
import { analyzeCars, checkBackendHealth } from './services/carAnalysisService';
import { CarData } from './types';

function App() {
  const [links, setLinks] = useState<string[]>([
    'https://www.olx.ro/oferta/audi-a4-2-0-tdi-2012-ID9v6wK.html',
    'https://www.olx.ro/oferta/vw-passat-cc-2-0-tdi-2011-ID9vXhP.html'
  ]);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'healthy' | 'down'>('checking');

  // Check backend status on app load
  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const isHealthy = await checkBackendHealth();
        setBackendStatus(isHealthy ? 'healthy' : 'down');
      } catch (err) {
        setBackendStatus('down');
      }
    };
    checkStatus();
  }, []);

  const handleAnalyze = async () => {
    if (backendStatus === 'down') {
      setError('Backend server is not running. Please start the backend first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeCars(links);
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze cars');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🚗 CarScore AI Analyzer</h1>
          <p className="text-gray-600">Get AI-powered analysis of used car listings</p>
        </header>

        {backendStatus === 'down' && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-red-700 font-medium">
                  Backend server is not running. Please start the backend server first using: npm run dev:backend
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Car Links to Analyze</h2>

          {links.map((link, index) => (
            <div key={index} className="mb-4">
              <div className="flex items-center">
                <input
                  type="text"
                  value={link}
                  onChange={(e) => handleLinkChange(index, e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Car listing URL ${index + 1}`}
                />
                <button
                  onClick={() => setLinks(links.filter((_, i) => i !== index))}
                  className="px-4 py-2 bg-red-500 text-white rounded-r-md hover:bg-red-600"
                  disabled={links.length <= 1}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => setLinks([...links, ''])}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Another Link
          </button>
        </div>

        <div className="text-center mb-8">
          <button
            onClick={handleAnalyze}
            disabled={loading || backendStatus === 'down'}
            className={`px-8 py-3 text-lg font-medium rounded-md ${loading || backendStatus === 'down'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
          >
            {loading ? 'Analyzing...' : 'Analyze Cars'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 text-green-600">🏆 Best Car Recommendation</h2>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{results.winner.title}</h3>
              <p className="text-2xl font-bold text-green-700 mt-2">
                Score: {results.winner.score}/100
              </p>
              <p className="text-lg text-gray-700 mt-1">
                Price: €{results.winner.price.toLocaleString()} (Predicted: €{results.winner.predictedPrice.toLocaleString()})
              </p>
              <div className="mt-2">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded mr-2">
                  Year: {results.winner.year}
                </span>
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded mr-2">
                  Km: {results.winner.kilometers.toLocaleString()}
                </span>
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                  {results.winner.fuel}
                </span>
              </div>
              {results.winner.defects.length > 0 && (
                <div className="mt-2">
                  <span className="font-medium text-red-600">Potential Issues:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {results.winner.defects.map((defect: string) => (
                      <span key={defect} className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {defect.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <h3 className="text-xl font-semibold mb-4">All Analyzed Cars</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Car</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issues</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.table.map((car: CarData) => (
                    <tr key={car.id} className={car.score === results.winner.score ? 'bg-green-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{car.title}</div>
                        <div className="text-sm text-gray-500">{car.year} • {car.kilometers.toLocaleString()} km</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">€{car.price.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Predicted: €{car.predictedPrice.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${car.score > 80 ? 'bg-green-100 text-green-800' :
                          car.score > 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                          {car.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {car.defects.map((defect) => (
                            <span key={defect} className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                              {defect.replace('_', ' ')}
                            </span>
                          ))}
                          {car.flags.map((flag) => (
                            <span key={flag} className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                              {flag.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;