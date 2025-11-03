export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';

export interface CarData {
  id: string;
  link: string;
  title: string;
  price: number;
  predictedPrice: number;
  year: number;
  kilometers: number;
  power: number;
  fuel: FuelType;
  defects: string[];
  flags: string[];
  score: number;
  description?: string;
}

export interface AnalysisResult {
  winner: CarData;
  table: CarData[];
  timestamp?: string;
}