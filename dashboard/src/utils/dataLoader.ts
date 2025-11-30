import Papa from 'papaparse';
import type { PatientRecord, ColumnDescriptions } from '../types';

// Get the base URL from Vite (handles GitHub Pages deployment)
const BASE_URL = import.meta.env.BASE_URL;

export async function loadCSVData(): Promise<PatientRecord[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(`${BASE_URL}mimic_pneumonia_cohort_full.csv`, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Deduplicate by stay_id (unique ICU stays)
        const uniqueStays = new Map<number, PatientRecord>();
        
        (results.data as PatientRecord[]).forEach((record) => {
          if (record.stay_id && !uniqueStays.has(record.stay_id)) {
            // Clean up the record
            const cleanRecord = {
              ...record,
              gender: record.gender === 'M' || record.gender === 'F' ? record.gender : 'M',
              hospital_expire_flag: record.hospital_expire_flag === 1 ? 1 : 0,
              first_hosp_stay: record.first_hosp_stay === true || String(record.first_hosp_stay) === 'True',
              first_icu_stay: record.first_icu_stay === true || String(record.first_icu_stay) === 'True',
            } as PatientRecord;
            
            uniqueStays.set(record.stay_id, cleanRecord);
          }
        });
        
        resolve(Array.from(uniqueStays.values()));
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export async function loadColumnDescriptions(): Promise<ColumnDescriptions> {
  const response = await fetch(`${BASE_URL}column_descriptions.json`);
  return response.json();
}

export function parseNumeric(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  return isNaN(num) ? null : num;
}

export function formatNumber(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  return value.toFixed(decimals);
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  return `${(value * 100).toFixed(decimals)}%`;
}

export function calculateStats(values: (number | null)[]): {
  min: number | null;
  max: number | null;
  mean: number | null;
  median: number | null;
  count: number;
} {
  const validValues = values.filter((v): v is number => v !== null && !isNaN(v));
  
  if (validValues.length === 0) {
    return { min: null, max: null, mean: null, median: null, count: 0 };
  }
  
  const sorted = [...validValues].sort((a, b) => a - b);
  const sum = validValues.reduce((acc, v) => acc + v, 0);
  const mid = Math.floor(sorted.length / 2);
  
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: sum / validValues.length,
    median: sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2,
    count: validValues.length,
  };
}

export function createAgeBins(data: PatientRecord[]): { bin: string; count: number; total: number; survived: number; died: number; mortalityRate: number }[] {
  const bins = [
    { label: '18-40', min: 18, max: 40 },
    { label: '41-60', min: 41, max: 60 },
    { label: '61-70', min: 61, max: 70 },
    { label: '71-80', min: 71, max: 80 },
    { label: '80+', min: 80, max: 200 },
  ];
  
  return bins.map(({ label, min, max }) => {
    const inBin = data.filter((p) => p.admission_age >= min && p.admission_age <= max);
    const survived = inBin.filter((p) => p.hospital_expire_flag === 0).length;
    const died = inBin.filter((p) => p.hospital_expire_flag === 1).length;
    const total = inBin.length;
    return {
      bin: label,
      count: total,
      total,
      survived,
      died,
      mortalityRate: total > 0 ? died / total : 0,
    };
  });
}

export function createHistogramData(
  values: number[],
  binCount = 10
): { bin: string; count: number; min: number; max: number }[] {
  if (values.length === 0) return [];
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binWidth = (max - min) / binCount;
  
  const bins: { bin: string; count: number; min: number; max: number }[] = [];
  
  for (let i = 0; i < binCount; i++) {
    const binMin = min + i * binWidth;
    const binMax = min + (i + 1) * binWidth;
    const count = values.filter((v) => v >= binMin && (i === binCount - 1 ? v <= binMax : v < binMax)).length;
    
    bins.push({
      bin: `${binMin.toFixed(0)}-${binMax.toFixed(0)}`,
      count,
      min: binMin,
      max: binMax,
    });
  }
  
  return bins;
}

export function groupByCategory<T extends PatientRecord>(
  data: T[],
  key: keyof T
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  
  data.forEach((record) => {
    const value = String(record[key] || 'Unknown');
    if (!groups.has(value)) {
      groups.set(value, []);
    }
    groups.get(value)!.push(record);
  });
  
  return groups;
}

export function calculateMortalityByGroup(
  data: PatientRecord[],
  key: keyof PatientRecord
): { name: string; total: number; survived: number; died: number; mortalityRate: number }[] {
  const groups = groupByCategory(data, key);
  
  return Array.from(groups.entries())
    .map(([name, records]) => {
      const died = records.filter((r) => r.hospital_expire_flag === 1).length;
      const survived = records.length - died;
      return {
        name,
        total: records.length,
        survived,
        died,
        mortalityRate: records.length > 0 ? died / records.length : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function getUniqueValues<T extends PatientRecord>(
  data: T[],
  key: keyof T
): string[] {
  const values = new Set<string>();
  data.forEach((record) => {
    const value = record[key];
    if (value !== null && value !== undefined && value !== '') {
      values.add(String(value));
    }
  });
  return Array.from(values).sort();
}

export function exportToCSV(data: PatientRecord[], filename: string): void {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

