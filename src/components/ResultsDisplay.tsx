import React from 'react';
import { AnalysisResult } from '../types';
import WinnerCard from './WinnerCard';
import ComparisonTable from './ComparisonTable';
import { ShareIcon } from './icons/ShareIcon';
import { RefreshIcon } from './icons/RefreshIcon';

interface ResultsDisplayProps {
  results: AnalysisResult;
  onShare: () => void;
  onReset: () => void;
}

const ResultsDisplay = React.forwardRef<HTMLDivElement, ResultsDisplayProps>(
  ({ results, onShare, onReset }, ref) => {
    return (
      <div className="w-full">
        <div ref={ref} className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
            <WinnerCard car={results.winner} />
            <h2 className="text-2xl font-bold text-center my-6 md:my-8 text-gray-200">Full Comparison</h2>
            <ComparisonTable cars={results.table} />
        </div>
        <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
                onClick={onShare}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors duration-300"
            >
                <ShareIcon />
                <span>Share as PNG</span>
            </button>
             <button
                onClick={onReset}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300"
            >
                <RefreshIcon />
                <span>Start New Analysis</span>
            </button>
        </div>
      </div>
    );
  }
);

export default ResultsDisplay;