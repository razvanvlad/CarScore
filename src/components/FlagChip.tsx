import React from 'react';

interface FlagChipProps {
  text: string;
  type: 'defect' | 'flag';
}

const FlagChip: React.FC<FlagChipProps> = ({ text, type }) => {
  const baseClasses = "text-xs font-semibold px-2 py-0.5 rounded-full capitalize";
  const typeClasses = {
    defect: 'bg-red-900 text-red-300',
    flag: 'bg-yellow-900 text-yellow-300'
  };

  const formattedText = text.replace(/_/g, ' ');

  return (
    <span className={`${baseClasses} ${typeClasses[type]}`}>
      {formattedText}
    </span>
  );
};

export default FlagChip;