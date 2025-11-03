import React from 'react';

interface WinnerCardProps {
  car: any;
}

export const WinnerCard: React.FC<WinnerCardProps> = ({ car }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-green-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{car.title}</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {car.year} • {car.kilometers.toLocaleString()} km
            </span>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {car.fuel} • {car.transmission}
            </span>
            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {car.power} HP • {car.engineCapacity} cm³
            </span>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-2">
            €{car.price.toLocaleString()}
            {car.predictedPrice && (
              <span className="text-lg font-normal text-gray-500 ml-2">
                (Predicted: €{car.predictedPrice.toLocaleString()})
              </span>
            )}
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto md:mx-0">
            <span className="text-2xl font-bold">{car.score}</span>
          </div>
          <div className="text-center md:text-right text-sm text-gray-600 mt-1">Score</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-1">Reliability Score</h3>
          <div className="text-2xl font-bold text-blue-600">{car.aiAnalysis?.reliabilityScore || 70}/100</div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-1">Value Assessment</h3>
          <div className="text-lg font-medium text-gray-900">{car.aiAnalysis?.valueAssessment || 'Good value'}</div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-1">Price Deviation</h3>
          <div className={car.priceDeviation > 0 ? 'text-red-600' : 'text-green-600'}>
            <span className="text-2xl font-bold">{car.priceDeviation > 0 ? '+' : ''}{car.priceDeviation}%</span>
            <span className="ml-1 text-sm">{car.priceDeviation > 0 ? 'Overpriced' : 'Underpriced'}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-bold text-lg mb-2 text-green-700">Highlights</h3>
        <div className="flex flex-wrap gap-2">
          {car.aiAnalysis?.highlights?.map((highlight: string, index: number) => (
            <span key={index} className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
              {highlight}
            </span>
          )) || (
              <span className="text-gray-500">No significant highlights identified</span>
            )}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-bold text-lg mb-2 text-red-700 flex items-center">
          ⚠️ Potential Issues
        </h3>
        <div className="space-y-2">
          {car.aiAnalysis?.concerns?.map((concern, index) => (
            <div key={index} className="flex items-start">
              <span className="text-red-500 mr-2 mt-1">•</span>
              <span className="text-gray-700">{concern}</span>
            </div>
          )) || (
              <span className="text-gray-500">No major concerns identified</span>
            )}

          {(car.aiAnalysis?.defects?.length > 0 || car.aiAnalysis?.flags?.length > 0) && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {car.aiAnalysis.defects.map((defect: string, index: number) => (
                  <span key={`defect-${index}`} className="bg-red-100 text-red-800 text-xs font-medium px-3 py-1 rounded">
                    {defect.replace('_', ' ')}
                  </span>
                ))}
                {car.aiAnalysis.flags.map((flag: string, index: number) => (
                  <span key={`flag-${index}`} className="bg-orange-100 text-orange-800 text-xs font-medium px-3 py-1 rounded">
                    {flag.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <h3 className="font-bold text-lg mb-2 text-blue-800">Seller Information</h3>
        <p className="text-gray-700">{car.seller || 'Private seller'}</p>
        <p className="text-sm text-gray-500 mt-1">Source: {car.source}</p>
      </div>
    </div>
  );
};