import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BoxPlot,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { useFilters } from '../context/FilterContext';
import { ChartContainer } from '../components/charts/ChartContainer';
import { calculateStats } from '../utils/dataLoader';

const COLORS = {
  survived: '#27AE60',
  died: '#E74C3C',
  primary: '#3498DB',
  secondary: '#8B5CF6',
};

interface LabCategory {
  name: string;
  labs: { key: string; label: string; unit: string; normalMin?: number; normalMax?: number }[];
}

const LAB_CATEGORIES: LabCategory[] = [
  {
    name: 'Complete Blood Count',
    labs: [
      { key: 'wbc', label: 'WBC', unit: 'K/uL', normalMin: 4.5, normalMax: 11 },
      { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', normalMin: 12, normalMax: 17.5 },
      { key: 'hematocrit', label: 'Hematocrit', unit: '%', normalMin: 36, normalMax: 52 },
      { key: 'platelets', label: 'Platelets', unit: 'K/uL', normalMin: 150, normalMax: 400 },
    ],
  },
  {
    name: 'Chemistry',
    labs: [
      { key: 'sodium', label: 'Sodium', unit: 'mEq/L', normalMin: 136, normalMax: 145 },
      { key: 'potassium', label: 'Potassium', unit: 'mEq/L', normalMin: 3.5, normalMax: 5 },
      { key: 'chloride', label: 'Chloride', unit: 'mEq/L', normalMin: 98, normalMax: 106 },
      { key: 'bicarbonate', label: 'Bicarbonate', unit: 'mEq/L', normalMin: 22, normalMax: 29 },
      { key: 'bun', label: 'BUN', unit: 'mg/dL', normalMin: 7, normalMax: 20 },
      { key: 'creatinine', label: 'Creatinine', unit: 'mg/dL', normalMin: 0.6, normalMax: 1.2 },
      { key: 'glucose', label: 'Glucose', unit: 'mg/dL', normalMin: 70, normalMax: 100 },
    ],
  },
  {
    name: 'Liver Function',
    labs: [
      { key: 'alt', label: 'ALT', unit: 'IU/L', normalMin: 7, normalMax: 56 },
      { key: 'ast', label: 'AST', unit: 'IU/L', normalMin: 10, normalMax: 40 },
      { key: 'alp', label: 'ALP', unit: 'IU/L', normalMin: 44, normalMax: 147 },
      { key: 'bilirubin_total', label: 'Bilirubin', unit: 'mg/dL', normalMin: 0.1, normalMax: 1.2 },
      { key: 'albumin', label: 'Albumin', unit: 'g/dL', normalMin: 3.4, normalMax: 5.4 },
    ],
  },
  {
    name: 'Coagulation',
    labs: [
      { key: 'pt', label: 'PT', unit: 'seconds', normalMin: 11, normalMax: 13.5 },
      { key: 'ptt', label: 'PTT', unit: 'seconds', normalMin: 25, normalMax: 35 },
      { key: 'inr', label: 'INR', unit: 'ratio', normalMin: 0.8, normalMax: 1.1 },
    ],
  },
];

export function ClinicalPage() {
  const { filteredData } = useFilters();
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedLab, setSelectedLab] = useState('wbc');
  const [threshold, setThreshold] = useState<number | null>(null);

  // Get current lab config
  const currentLab = useMemo(() => {
    for (const cat of LAB_CATEGORIES) {
      const lab = cat.labs.find((l) => l.key === selectedLab);
      if (lab) return lab;
    }
    return LAB_CATEGORIES[0].labs[0];
  }, [selectedLab]);

  // Calculate lab value stats by outcome
  const labStats = useMemo(() => {
    const minKey = `${selectedLab}_min` as keyof typeof filteredData[0];
    const maxKey = `${selectedLab}_max` as keyof typeof filteredData[0];

    const survivedData = filteredData.filter((p) => p.hospital_expire_flag === 0);
    const diedData = filteredData.filter((p) => p.hospital_expire_flag === 1);

    const getValues = (data: typeof filteredData, key: keyof typeof filteredData[0]) =>
      data.map((p) => p[key] as number).filter((v) => v !== null && !isNaN(v));

    return {
      survived: {
        min: calculateStats(getValues(survivedData, minKey)),
        max: calculateStats(getValues(survivedData, maxKey)),
      },
      died: {
        min: calculateStats(getValues(diedData, minKey)),
        max: calculateStats(getValues(diedData, maxKey)),
      },
    };
  }, [filteredData, selectedLab]);

  // Box plot data
  const boxPlotData = useMemo(() => {
    const minKey = `${selectedLab}_min` as keyof typeof filteredData[0];
    
    const survivedValues = filteredData
      .filter((p) => p.hospital_expire_flag === 0)
      .map((p) => p[minKey] as number)
      .filter((v) => v !== null && !isNaN(v))
      .sort((a, b) => a - b);

    const diedValues = filteredData
      .filter((p) => p.hospital_expire_flag === 1)
      .map((p) => p[minKey] as number)
      .filter((v) => v !== null && !isNaN(v))
      .sort((a, b) => a - b);

    const getQuartiles = (values: number[]) => {
      if (values.length === 0) return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
      const q1Idx = Math.floor(values.length * 0.25);
      const medIdx = Math.floor(values.length * 0.5);
      const q3Idx = Math.floor(values.length * 0.75);
      return {
        min: values[0],
        q1: values[q1Idx],
        median: values[medIdx],
        q3: values[q3Idx],
        max: values[values.length - 1],
      };
    };

    return [
      { name: 'Survived', ...getQuartiles(survivedValues), color: COLORS.survived },
      { name: 'Died', ...getQuartiles(diedValues), color: COLORS.died },
    ];
  }, [filteredData, selectedLab]);

  // Threshold analysis
  const thresholdAnalysis = useMemo(() => {
    if (threshold === null) return null;

    const minKey = `${selectedLab}_min` as keyof typeof filteredData[0];
    const aboveThreshold = filteredData.filter((p) => {
      const val = p[minKey] as number;
      return val !== null && !isNaN(val) && val >= threshold;
    });
    const belowThreshold = filteredData.filter((p) => {
      const val = p[minKey] as number;
      return val !== null && !isNaN(val) && val < threshold;
    });

    const aboveMortality = aboveThreshold.length > 0
      ? aboveThreshold.filter((p) => p.hospital_expire_flag === 1).length / aboveThreshold.length
      : 0;
    const belowMortality = belowThreshold.length > 0
      ? belowThreshold.filter((p) => p.hospital_expire_flag === 1).length / belowThreshold.length
      : 0;

    return {
      above: {
        count: aboveThreshold.length,
        mortality: aboveMortality,
        survived: aboveThreshold.filter((p) => p.hospital_expire_flag === 0).length,
        died: aboveThreshold.filter((p) => p.hospital_expire_flag === 1).length,
      },
      below: {
        count: belowThreshold.length,
        mortality: belowMortality,
        survived: belowThreshold.filter((p) => p.hospital_expire_flag === 0).length,
        died: belowThreshold.filter((p) => p.hospital_expire_flag === 1).length,
      },
    };
  }, [filteredData, selectedLab, threshold]);

  // Comparison bar data
  const comparisonData = useMemo(() => {
    return [
      {
        name: 'Min Value',
        Survived: labStats.survived.min.median || 0,
        Died: labStats.died.min.median || 0,
      },
      {
        name: 'Max Value',
        Survived: labStats.survived.max.median || 0,
        Died: labStats.died.max.median || 0,
      },
    ];
  }, [labStats]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Lab Category Tabs */}
      <div className="card">
        <div className="flex flex-wrap gap-2 mb-4">
          {LAB_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              onClick={() => {
                setSelectedCategory(idx);
                setSelectedLab(cat.labs[0].key);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === idx
                  ? 'bg-medical-blue text-white'
                  : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Lab Selector */}
        <div className="flex flex-wrap gap-2">
          {LAB_CATEGORIES[selectedCategory].labs.map((lab) => (
            <button
              key={lab.key}
              onClick={() => setSelectedLab(lab.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedLab === lab.key
                  ? 'bg-primary-800 text-white'
                  : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
              }`}
            >
              {lab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartContainer
          title={`${currentLab.label} - Survived Patients`}
          subtitle={`Unit: ${currentLab.unit}`}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-survived/10 rounded-lg p-4">
              <div className="text-sm text-primary-500">Minimum Value</div>
              <div className="text-2xl font-bold text-survived">
                {labStats.survived.min.median?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-xs text-primary-400">
                Range: {labStats.survived.min.min?.toFixed(1)} - {labStats.survived.min.max?.toFixed(1)}
              </div>
            </div>
            <div className="bg-survived/10 rounded-lg p-4">
              <div className="text-sm text-primary-500">Maximum Value</div>
              <div className="text-2xl font-bold text-survived">
                {labStats.survived.max.median?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-xs text-primary-400">
                Range: {labStats.survived.max.min?.toFixed(1)} - {labStats.survived.max.max?.toFixed(1)}
              </div>
            </div>
          </div>
          {currentLab.normalMin !== undefined && (
            <div className="mt-3 text-sm text-primary-500">
              Normal range: {currentLab.normalMin} - {currentLab.normalMax} {currentLab.unit}
            </div>
          )}
        </ChartContainer>

        <ChartContainer
          title={`${currentLab.label} - Deceased Patients`}
          subtitle={`Unit: ${currentLab.unit}`}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-died/10 rounded-lg p-4">
              <div className="text-sm text-primary-500">Minimum Value</div>
              <div className="text-2xl font-bold text-died">
                {labStats.died.min.median?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-xs text-primary-400">
                Range: {labStats.died.min.min?.toFixed(1)} - {labStats.died.min.max?.toFixed(1)}
              </div>
            </div>
            <div className="bg-died/10 rounded-lg p-4">
              <div className="text-sm text-primary-500">Maximum Value</div>
              <div className="text-2xl font-bold text-died">
                {labStats.died.max.median?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-xs text-primary-400">
                Range: {labStats.died.max.min?.toFixed(1)} - {labStats.died.max.max?.toFixed(1)}
              </div>
            </div>
          </div>
          {currentLab.normalMin !== undefined && (
            <div className="mt-3 text-sm text-primary-500">
              Normal range: {currentLab.normalMin} - {currentLab.normalMax} {currentLab.unit}
            </div>
          )}
        </ChartContainer>
      </div>

      {/* Box Plot Visualization */}
      <ChartContainer
        title={`${currentLab.label} Distribution by Outcome`}
        subtitle="Box plot showing quartiles (min, Q1, median, Q3, max)"
      >
        <div className="h-64">
          <div className="flex justify-center items-end h-full gap-16 pb-8">
            {boxPlotData.map((data) => (
              <div key={data.name} className="flex flex-col items-center">
                <div className="relative h-40 w-20">
                  {/* Whiskers */}
                  <div 
                    className="absolute left-1/2 w-px bg-primary-400"
                    style={{
                      bottom: `${((data.min - boxPlotData[0].min) / (Math.max(boxPlotData[0].max, boxPlotData[1].max) - Math.min(boxPlotData[0].min, boxPlotData[1].min))) * 100}%`,
                      height: `${((data.q1 - data.min) / (Math.max(boxPlotData[0].max, boxPlotData[1].max) - Math.min(boxPlotData[0].min, boxPlotData[1].min))) * 100}%`,
                    }}
                  />
                  <div 
                    className="absolute left-1/2 w-px bg-primary-400"
                    style={{
                      bottom: `${((data.q3 - boxPlotData[0].min) / (Math.max(boxPlotData[0].max, boxPlotData[1].max) - Math.min(boxPlotData[0].min, boxPlotData[1].min))) * 100}%`,
                      height: `${((data.max - data.q3) / (Math.max(boxPlotData[0].max, boxPlotData[1].max) - Math.min(boxPlotData[0].min, boxPlotData[1].min))) * 100}%`,
                    }}
                  />
                  {/* Box */}
                  <div 
                    className="absolute left-0 right-0 rounded"
                    style={{
                      bottom: `${((data.q1 - Math.min(boxPlotData[0].min, boxPlotData[1].min)) / (Math.max(boxPlotData[0].max, boxPlotData[1].max) - Math.min(boxPlotData[0].min, boxPlotData[1].min))) * 100}%`,
                      height: `${((data.q3 - data.q1) / (Math.max(boxPlotData[0].max, boxPlotData[1].max) - Math.min(boxPlotData[0].min, boxPlotData[1].min))) * 100}%`,
                      backgroundColor: data.color,
                      opacity: 0.7,
                    }}
                  />
                  {/* Median line */}
                  <div 
                    className="absolute left-0 right-0 h-0.5 bg-white"
                    style={{
                      bottom: `${((data.median - Math.min(boxPlotData[0].min, boxPlotData[1].min)) / (Math.max(boxPlotData[0].max, boxPlotData[1].max) - Math.min(boxPlotData[0].min, boxPlotData[1].min))) * 100}%`,
                    }}
                  />
                </div>
                <div className="mt-2 text-center">
                  <div className="font-medium" style={{ color: data.color }}>{data.name}</div>
                  <div className="text-xs text-primary-500">
                    Median: {data.median.toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ChartContainer>

      {/* Median Comparison */}
      <ChartContainer
        title="Median Value Comparison"
        subtitle="Comparing survivors vs deceased"
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Survived" fill={COLORS.survived} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Died" fill={COLORS.died} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Threshold Explorer */}
      <ChartContainer
        title="Lab Value Threshold Explorer"
        subtitle={`Set a threshold to see mortality rates above and below`}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-primary-600">
              Threshold ({currentLab.unit}):
            </label>
            <input
              type="number"
              value={threshold ?? ''}
              onChange={(e) => setThreshold(e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="Enter threshold"
              className="input-base w-40"
            />
            {currentLab.normalMax && (
              <button
                onClick={() => setThreshold(currentLab.normalMax!)}
                className="btn-secondary text-sm"
              >
                Use Upper Normal ({currentLab.normalMax})
              </button>
            )}
          </div>

          {thresholdAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-primary-50 rounded-lg p-4">
                <div className="text-lg font-semibold text-primary-700">
                  Below {threshold} {currentLab.unit}
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <div>Patients: {thresholdAnalysis.below.count.toLocaleString()}</div>
                  <div className="text-survived">Survived: {thresholdAnalysis.below.survived.toLocaleString()}</div>
                  <div className="text-died">Died: {thresholdAnalysis.below.died.toLocaleString()}</div>
                  <div className="text-lg font-bold text-primary-800 mt-2">
                    Mortality: {(thresholdAnalysis.below.mortality * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="bg-medical-amber/10 rounded-lg p-4">
                <div className="text-lg font-semibold text-primary-700">
                  Above or Equal {threshold} {currentLab.unit}
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <div>Patients: {thresholdAnalysis.above.count.toLocaleString()}</div>
                  <div className="text-survived">Survived: {thresholdAnalysis.above.survived.toLocaleString()}</div>
                  <div className="text-died">Died: {thresholdAnalysis.above.died.toLocaleString()}</div>
                  <div className="text-lg font-bold text-primary-800 mt-2">
                    Mortality: {(thresholdAnalysis.above.mortality * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ChartContainer>
    </div>
  );
}

