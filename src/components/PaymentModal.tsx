import React, { useState } from 'react';

interface PaymentModalProps {
  onPaymentSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onPaymentSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = () => {
    setIsProcessing(true);
    // Simulate payment processing time
    setTimeout(() => {
      onPaymentSuccess();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-gray-700">
        <h2 className="text-2xl font-bold text-center text-white">Analysis Complete!</h2>
        <p className="text-center text-gray-400 mt-2">
          Unlock your detailed car comparison report for a one-time fee.
        </p>
        <div className="my-6 p-6 bg-gray-900 rounded-lg text-center">
          <span className="text-5xl font-bold text-purple-400">9.99</span>
          <span className="text-xl text-gray-400"> LEI</span>
        </div>
        <button
          onClick={handlePay}
          disabled={isProcessing}
          className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-wait transition-colors duration-300 flex items-center justify-center"
        >
          {isProcessing ? (
             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : null}
          {isProcessing ? 'Processing Payment...' : 'Pay & View Results'}
        </button>
        <p className="text-xs text-gray-500 text-center mt-4">
          This is a simulated payment for demonstration purposes.
        </p>
      </div>
    </div>
  );
};

export default PaymentModal;