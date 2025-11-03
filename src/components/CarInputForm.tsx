import React from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { XIcon } from './icons/XIcon';

interface CarInputFormProps {
  links: string[];
  setLinks: React.Dispatch<React.SetStateAction<string[]>>;
  onSubmit: () => void;
  error: string | null;
}

const CarInputForm: React.FC<CarInputFormProps> = ({ links, setLinks, onSubmit, error }) => {
  const updateLink = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const addLink = () => {
    if (links.length < 10) {
      setLinks([...links, '']);
    }
  };

  const removeLink = (index: number) => {
    if (links.length > 1) {
      const newLinks = links.filter((_, i) => i !== index);
      setLinks(newLinks);
    }
  };

  return (
    <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl border border-gray-700">
      <div className="space-y-4">
        {links.map((link, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span className="text-gray-400 font-mono text-lg">{index + 1}.</span>
            <input
              type="url"
              value={link}
              onChange={(e) => updateLink(index, e.target.value)}
              placeholder="https://www.autovit.ro/..."
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors duration-200"
            />
            {links.length > 1 && (
              <button onClick={() => removeLink(index)} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                <XIcon />
              </button>
            )}
          </div>
        ))}
      </div>

      {links.length < 10 && (
        <button
          onClick={addLink}
          className="mt-4 flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
        >
          <PlusIcon />
          <span>Add another link</span>
        </button>
      )}

      {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
      
      <div className="mt-8 text-center">
        <button
          onClick={onSubmit}
          disabled={links.every(link => link.trim() === '')}
          className="bg-purple-600 text-white font-bold py-3 px-12 rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Judge My Cars
        </button>
      </div>
    </div>
  );
};

export default CarInputForm;