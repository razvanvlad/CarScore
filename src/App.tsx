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
          <div className="space-y-6">
            {/* Winner Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6 text-green-600">🏆 Best Car Recommendation</h2>

              <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{results.winner.title}</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Score</p>
                    <p className="text-3xl font-bold text-green-700">{results.winner.score}/100</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="text-2xl font-bold text-gray-900">€{results.winner.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Year</p>
                    <p className="text-2xl font-bold text-gray-900">{results.winner.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mileage</p>
                    <p className="text-2xl font-bold text-gray-900">{results.winner.kilometers.toLocaleString()} km</p>
                  </div>
                </div>

                {/* Specifications Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 bg-white p-4 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">⛽</span>
                    <span className="text-sm"><strong>Fuel:</strong> {results.winner.fuel}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">⚙️</span>
                    <span className="text-sm"><strong>Trans:</strong> {results.winner.transmission}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">🔋</span>
                    <span className="text-sm"><strong>Power:</strong> {results.winner.power} HP</span>
                  </div>
                  {results.winner.engineSize && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">🔧</span>
                      <span className="text-sm"><strong>Engine:</strong> {results.winner.engineSize}</span>
                    </div>
                  )}
                  {results.winner.color && results.winner.color !== 'Unknown' && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">🎨</span>
                      <span className="text-sm"><strong>Color:</strong> {results.winner.color}</span>
                    </div>
                  )}
                  {results.winner.bodyType && results.winner.bodyType !== 'Unknown' && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">🚗</span>
                      <span className="text-sm"><strong>Body:</strong> {results.winner.bodyType}</span>
                    </div>
                  )}
                </div>

                {/* AI Insights */}
                {results.winner.valueAssessment && (
                  <div className="mb-4 p-3 bg-blue-50 rounded">
                    <p className="font-medium text-blue-900">💡 AI Assessment:</p>
                    <p className="text-sm text-blue-800 mt-1">{results.winner.valueAssessment}</p>
                  </div>
                )}

                {/* Highlights */}
                {results.winner.highlights && results.winner.highlights.length > 0 && (
                  <div className="mb-4">
                    <p className="font-medium text-green-700 mb-2">✅ Highlights:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {results.winner.highlights.map((highlight: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-700">{highlight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Concerns */}
                {results.winner.concerns && results.winner.concerns.length > 0 && (
                  <div className="mb-4">
                    <p className="font-medium text-orange-700 mb-2">⚠️ Concerns:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {results.winner.concerns.map((concern: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-700">{concern}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Issues */}
                {(results.winner.defects?.length > 0 || results.winner.flags?.length > 0) && (
                  <div>
                    <p className="font-medium text-red-600 mb-2">🔴 Potential Issues:</p>
                    <div className="flex flex-wrap gap-2">
                      {results.winner.defects?.map((defect: string) => (
                        <span key={defect} className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded">
                          {defect.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      ))}
                      {results.winner.flags?.map((flag: string) => (
                        <span key={flag} className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-1 rounded">
                          {flag.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comparison Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">📊 All Analyzed Cars</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Car</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specs</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issues</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.table.map((car: CarData) => (
                      <tr key={car.id} className={car.score === results.winner.score ? 'bg-green-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">{car.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {car.year} • {car.kilometers.toLocaleString()} km
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs space-y-1">
                            <div>{car.fuel} • {car.transmission}</div>
                            <div>{car.power} HP{car.engineSize ? ` • ${car.engineSize}` : ''}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">€{car.price.toLocaleString()}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                            car.score > 80 ? 'bg-green-100 text-green-800' :
                            car.score > 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {car.score}/100
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {car.defects?.slice(0, 3).map((defect: string) => (
                              <span key={defect} className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                {defect.replace('_', ' ')}
                              </span>
                            ))}
                            {car.flags?.slice(0, 2).map((flag: string) => (
                              <span key={flag} className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                {flag.replace('_', ' ')}
                              </span>
                            ))}
                            {(car.defects?.length > 3 || car.flags?.length > 2) && (
                              <span className="text-xs text-gray-500">+{(car.defects?.length || 0) + (car.flags?.length || 0) - 5} more</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;