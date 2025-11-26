import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import type { PatientRecord, FilterState } from '../types';

interface FilterContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  filteredData: PatientRecord[];
  allData: PatientRecord[];
  setAllData: (data: PatientRecord[]) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
}

const defaultFilters: FilterState = {
  ageRange: [18, 91],
  gender: [],
  race: [],
  insurance: [],
  admissionType: [],
  outcome: [],
  icuLosRange: [0, 100],
  hospitalLosRange: [0, 200],
  searchId: '',
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [allData, setAllData] = useState<PatientRecord[]>([]);

  const filteredData = useMemo(() => {
    return allData.filter((record) => {
      // Age filter
      if (record.admission_age < filters.ageRange[0] || record.admission_age > filters.ageRange[1]) {
        return false;
      }

      // Gender filter
      if (filters.gender.length > 0 && !filters.gender.includes(record.gender)) {
        return false;
      }

      // Race filter
      if (filters.race.length > 0 && !filters.race.includes(record.race)) {
        return false;
      }

      // Insurance filter
      if (filters.insurance.length > 0 && !filters.insurance.includes(record.insurance)) {
        return false;
      }

      // Admission type filter
      if (filters.admissionType.length > 0 && !filters.admissionType.includes(record.admission_type)) {
        return false;
      }

      // Outcome filter
      if (filters.outcome.length > 0) {
        const isSurvived = record.hospital_expire_flag === 0;
        const isDied = record.hospital_expire_flag === 1;
        if (!((filters.outcome.includes('survived') && isSurvived) || (filters.outcome.includes('died') && isDied))) {
          return false;
        }
      }

      // ICU LOS filter
      if (record.los_icu !== null && record.los_icu !== undefined) {
        if (record.los_icu < filters.icuLosRange[0] || record.los_icu > filters.icuLosRange[1]) {
          return false;
        }
      }

      // Hospital LOS filter
      if (record.los_hospital !== null && record.los_hospital !== undefined) {
        if (record.los_hospital < filters.hospitalLosRange[0] || record.los_hospital > filters.hospitalLosRange[1]) {
          return false;
        }
      }

      // Search ID filter
      if (filters.searchId) {
        const searchLower = filters.searchId.toLowerCase();
        const matchesSubject = String(record.subject_id).includes(searchLower);
        const matchesHadm = String(record.hadm_id).includes(searchLower);
        const matchesStay = String(record.stay_id).includes(searchLower);
        if (!matchesSubject && !matchesHadm && !matchesStay) {
          return false;
        }
      }

      return true;
    });
  }, [allData, filters]);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.ageRange[0] !== 18 || filters.ageRange[1] !== 91) count++;
    if (filters.gender.length > 0) count++;
    if (filters.race.length > 0) count++;
    if (filters.insurance.length > 0) count++;
    if (filters.admissionType.length > 0) count++;
    if (filters.outcome.length > 0) count++;
    if (filters.icuLosRange[0] !== 0 || filters.icuLosRange[1] !== 100) count++;
    if (filters.hospitalLosRange[0] !== 0 || filters.hospitalLosRange[1] !== 200) count++;
    if (filters.searchId) count++;
    return count;
  }, [filters]);

  const value = useMemo(
    () => ({
      filters,
      setFilters,
      filteredData,
      allData,
      setAllData,
      resetFilters,
      activeFilterCount,
      updateFilter,
    }),
    [filters, filteredData, allData, resetFilters, activeFilterCount, updateFilter]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}

