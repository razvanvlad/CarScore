import React from 'react';
import { CarData } from '../types';
import useSortableData from '../hooks/useSortableData';
import FlagChip from './FlagChip';
import { SortIcon } from './icons/SortIcon';

interface ComparisonTableProps {
  cars: CarData[];
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ cars }) => {
  const { items, requestSort, sortConfig } = useSortableData<CarData>(cars);

  const getSortDirection = (key: keyof CarData) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction;
  };

  const headers: { key: keyof CarData; label: string }[] = [
    { key: 'score', label: 'Score' },
    { key: 'price', label: 'Price (€)' },
    { key: 'year', label: 'Year' },
    { key: 'kilometers', label: 'KM' },
    { key: 'power', label: 'Power (HP)' },
    { key: 'fuel', label: 'Fuel' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-300">
        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
          <tr>
            <th scope="col" className="px-4 py-3">#</th>
            <th scope="col" className="px-4 py-3">Car Details</th>
            {headers.map(header => (
              <th key={header.key} scope="col" className="px-4 py-3 cursor-pointer" onClick={() => requestSort(header.key)}>
                <div className="flex items-center gap-1">
                  {header.label}
                  <SortIcon direction={getSortDirection(header.key)} />
                </div>
              </th>
            ))}
            <th scope="col" className="px-4 py-3">Issues</th>
          </tr>
        </thead>
        <tbody>
          {items.map((car, index) => (
            <tr key={car.id} className="border-b border-gray-700 hover:bg-gray-700/30">
              <td className="px-4 py-4 font-medium">{index + 1}</td>
              <th scope="row" className="px-4 py-4 font-medium text-white whitespace-nowrap">
                <a href={car.link} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
                  {car.title}
                </a>
              </th>
              <td className={`px-4 py-4 font-bold ${car.score >= 80 ? 'text-green-400' : car.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{car.score}</td>
              <td className="px-4 py-4">{car.price.toLocaleString('ro-RO')}</td>
              <td className="px-4 py-4">{car.year}</td>
              <td className="px-4 py-4">{car.kilometers.toLocaleString('ro-RO')}</td>
              <td className="px-4 py-4">{car.power}</td>
              <td className="px-4 py-4">{car.fuel}</td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-1 w-32">
                  {car.defects.map(d => <FlagChip key={d} text={d} type="defect" />)}
                  {car.flags.map(f => <FlagChip key={f} text={f} type="flag" />)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonTable;