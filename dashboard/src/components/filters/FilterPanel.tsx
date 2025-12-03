import { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, Filter, Search, X } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { getUniqueValues } from '../../utils/dataLoader';
import { RangeSlider } from './RangeSlider';
import { MultiSelect } from './MultiSelect';

export function FilterPanel() {
  const { filters, updateFilter, resetFilters, activeFilterCount, allData, filteredData } = useFilters();
  const [isExpanded, setIsExpanded] = useState(true);

  const genderOptions = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
  ];

  const outcomeOptions = [
    { value: 'survived', label: 'Survived' },
    { value: 'died', label: 'Died' },
  ];

  const raceOptions = getUniqueValues(allData, 'race').map((r) => ({ value: r, label: r }));
  const insuranceOptions = getUniqueValues(allData, 'insurance').map((i) => ({ value: i, label: i }));
  const admissionTypeOptions = getUniqueValues(allData, 'admission_type').map((a) => ({ value: a, label: a }));

  return (
    <div className="bg-white rounded-xl shadow-card border border-primary-100">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-100 cursor-pointer rounded-t-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary-600" />
          <span className="font-semibold text-primary-800">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-medical-blue text-white text-xs rounded-full font-medium">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-primary-500">
            {filteredData.length.toLocaleString()} / {allData.length.toLocaleString()} records
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-primary-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-primary-500" />
          )}
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 pb-4 space-y-4 overflow-visible">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
            <input
              type="text"
              placeholder="Search by Patient ID, Admission ID, or Stay ID..."
              value={filters.searchId}
              onChange={(e) => updateFilter('searchId', e.target.value)}
              className="input-base pl-9 pr-9"
            />
            {filters.searchId && (
              <button
                onClick={() => updateFilter('searchId', '')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Grid of Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-visible">
            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Age Range
              </label>
              <RangeSlider
                min={18}
                max={91}
                value={filters.ageRange}
                onChange={(value) => updateFilter('ageRange', value)}
                formatLabel={(v) => (v === 91 ? '89+' : String(v))}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Gender
              </label>
              <MultiSelect
                options={genderOptions}
                value={filters.gender}
                onChange={(value) => updateFilter('gender', value)}
                placeholder="All genders"
              />
            </div>

            {/* Race/Ethnicity */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Race/Ethnicity
              </label>
              <MultiSelect
                options={raceOptions}
                value={filters.race}
                onChange={(value) => updateFilter('race', value)}
                placeholder="All races"
              />
            </div>

            {/* Insurance */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Insurance Type
              </label>
              <MultiSelect
                options={insuranceOptions}
                value={filters.insurance}
                onChange={(value) => updateFilter('insurance', value)}
                placeholder="All insurance"
              />
            </div>

            {/* Admission Type */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Admission Type
              </label>
              <MultiSelect
                options={admissionTypeOptions}
                value={filters.admissionType}
                onChange={(value) => updateFilter('admissionType', value)}
                placeholder="All types"
              />
            </div>

            {/* Outcome */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Outcome
              </label>
              <MultiSelect
                options={outcomeOptions}
                value={filters.outcome}
                onChange={(value) => updateFilter('outcome', value as ('survived' | 'died')[])}
                placeholder="All outcomes"
              />
            </div>

            {/* ICU LOS Range */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                ICU Length of Stay (days)
              </label>
              <RangeSlider
                min={0}
                max={100}
                value={filters.icuLosRange}
                onChange={(value) => updateFilter('icuLosRange', value)}
                step={1}
              />
            </div>

            {/* Hospital LOS Range */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Hospital Length of Stay (days)
              </label>
              <RangeSlider
                min={0}
                max={200}
                value={filters.hospitalLosRange}
                onChange={(value) => updateFilter('hospitalLosRange', value)}
                step={1}
              />
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-primary-100">
              <span className="text-sm text-primary-500">Active:</span>
              {filters.gender.length > 0 && (
                <span className="filter-chip">
                  Gender: {filters.gender.join(', ')}
                  <button onClick={() => updateFilter('gender', [])} className="hover:text-medical-blue/80">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.outcome.length > 0 && (
                <span className="filter-chip">
                  Outcome: {filters.outcome.join(', ')}
                  <button onClick={() => updateFilter('outcome', [])} className="hover:text-medical-blue/80">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(filters.ageRange[0] !== 18 || filters.ageRange[1] !== 91) && (
                <span className="filter-chip">
                  Age: {filters.ageRange[0]} - {filters.ageRange[1] === 91 ? '89+' : filters.ageRange[1]}
                  <button onClick={() => updateFilter('ageRange', [18, 91])} className="hover:text-medical-blue/80">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-died hover:text-died-dark font-medium transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

