import { useMemo, useState } from 'react';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Line,
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

interface VitalConfig {
  key: string;
  label: string;
  unit: string;
  normalMin?: number;
  normalMax?: number;
}

const VITAL_CONFIGS: VitalConfig[] = [
  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', normalMin: 60, normalMax: 100 },
  { key: 'sbp', label: 'Systolic BP', unit: 'mmHg', normalMin: 90, normalMax: 120 },
  { key: 'dbp', label: 'Diastolic BP', unit: 'mmHg', normalMin: 60, normalMax: 80 },
  { key: 'mbp', label: 'Mean Arterial BP', unit: 'mmHg', normalMin: 70, normalMax: 100 },
  { key: 'resp_rate', label: 'Respiratory Rate', unit: 'breaths/min', normalMin: 12, normalMax: 20 },
  { key: 'temperature', label: 'Temperature', unit: '°C', normalMin: 36.1, normalMax: 37.2 },
  { key: 'spo2', label: 'SpO2', unit: '%', normalMin: 95, normalMax: 100 },
];

export function VitalsPage() {
  const { filteredData } = useFilters();
  const [selectedVital, setSelectedVital] = useState('heart_rate');
  const [showMean, setShowMean] = useState(true);

  const currentVital = VITAL_CONFIGS.find((v) => v.key === selectedVital)!;

  // Calculate stats for selected vital
  const vitalStats = useMemo(() => {
    const minKey = `${selectedVital}_min` as keyof typeof filteredData[0];
    const maxKey = `${selectedVital}_max` as keyof typeof filteredData[0];
    const meanKey = `${selectedVital}_mean` as keyof typeof filteredData[0];

    const survivedData = filteredData.filter((p) => p.hospital_expire_flag === 0);
    const diedData = filteredData.filter((p) => p.hospital_expire_flag === 1);

    const getValues = (data: typeof filteredData, key: keyof typeof filteredData[0]) =>
      data.map((p) => p[key] as number).filter((v) => v !== null && !isNaN(v));

    return {
      survived: {
        min: calculateStats(getValues(survivedData, minKey)),
        max: calculateStats(getValues(survivedData, maxKey)),
        mean: calculateStats(getValues(survivedData, meanKey)),
      },
      died: {
        min: calculateStats(getValues(diedData, minKey)),
        max: calculateStats(getValues(diedData, maxKey)),
        mean: calculateStats(getValues(diedData, meanKey)),
      },
    };
  }, [filteredData, selectedVital]);

  // Histogram data
  const histogramData = useMemo(() => {
    const meanKey = `${selectedVital}_mean` as keyof typeof filteredData[0];
    
    const survivedValues = filteredData
      .filter((p) => p.hospital_expire_flag === 0)
      .map((p) => p[meanKey] as number)
      .filter((v) => v !== null && !isNaN(v));

    const diedValues = filteredData
      .filter((p) => p.hospital_expire_flag === 1)
      .map((p) => p[meanKey] as number)
      .filter((v) => v !== null && !isNaN(v));

    const allValues = [...survivedValues, ...diedValues];
    if (allValues.length === 0) return [];

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const binCount = 15;
    const binWidth = (max - min) / binCount;

    return Array.from({ length: binCount }, (_, i) => {
      const binMin = min + i * binWidth;
      const binMax = min + (i + 1) * binWidth;
      const label = binMin.toFixed(0);

      return {
        bin: label,
        survived: survivedValues.filter((v) => v >= binMin && v < binMax).length,
        died: diedValues.filter((v) => v >= binMin && v < binMax).length,
      };
    });
  }, [filteredData, selectedVital]);

  // Range data for comparison
  const rangeData = useMemo(() => {
    return [
      {
        name: 'Survived',
        min: vitalStats.survived.min.median || 0,
        max: vitalStats.survived.max.median || 0,
        mean: vitalStats.survived.mean.median || 0,
      },
      {
        name: 'Died',
        min: vitalStats.died.min.median || 0,
        max: vitalStats.died.max.median || 0,
        mean: vitalStats.died.mean.median || 0,
      },
    ];
  }, [vitalStats]);

  // Abnormal vital signs analysis
  const abnormalAnalysis = useMemo(() => {
    const results = VITAL_CONFIGS.map((vital) => {
      const meanKey = `${vital.key}_mean` as keyof typeof filteredData[0];
      
      const abnormal = filteredData.filter((p) => {
        const val = p[meanKey] as number;
        if (val === null || isNaN(val)) return false;
        if (vital.normalMin !== undefined && val < vital.normalMin) return true;
        if (vital.normalMax !== undefined && val > vital.normalMax) return true;
        return false;
      });

      const abnormalMortality = abnormal.length > 0
        ? abnormal.filter((p) => p.hospital_expire_flag === 1).length / abnormal.length
        : 0;

      return {
        name: vital.label,
        abnormalCount: abnormal.length,
        abnormalPercent: (abnormal.length / filteredData.length) * 100,
        mortality: abnormalMortality * 100,
      };
    });

    return results.sort((a, b) => b.abnormalPercent - a.abnormalPercent);
  }, [filteredData]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Vital Sign Selector */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {VITAL_CONFIGS.map((vital) => (
            <button
              key={vital.key}
              onClick={() => setSelectedVital(vital.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedVital === vital.key
                  ? 'bg-medical-blue text-white'
                  : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
              }`}
            >
              {vital.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Survived Stats */}
        <ChartContainer
          title={`${currentVital.label} - Survived`}
          subtitle={`${currentVital.unit}`}
        >
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-survived/10 rounded-lg p-4 text-center">
              <div className="text-sm text-primary-500">Min (Median)</div>
              <div className="text-2xl font-bold text-survived">
                {vitalStats.survived.min.median?.toFixed(1) || 'N/A'}
              </div>
            </div>
            <div className="bg-survived/10 rounded-lg p-4 text-center">
              <div className="text-sm text-primary-500">Mean (Median)</div>
              <div className="text-2xl font-bold text-survived">
                {vitalStats.survived.mean.median?.toFixed(1) || 'N/A'}
              </div>
            </div>
            <div className="bg-survived/10 rounded-lg p-4 text-center">
              <div className="text-sm text-primary-500">Max (Median)</div>
              <div className="text-2xl font-bold text-survived">
                {vitalStats.survived.max.median?.toFixed(1) || 'N/A'}
              </div>
            </div>
          </div>
          {currentVital.normalMin && (
            <div className="mt-3 text-sm text-primary-500">
              Normal range: {currentVital.normalMin} - {currentVital.normalMax} {currentVital.unit}
            </div>
          )}
        </ChartContainer>

        {/* Died Stats */}
        <ChartContainer
          title={`${currentVital.label} - Deceased`}
          subtitle={`${currentVital.unit}`}
        >
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-died/10 rounded-lg p-4 text-center">
              <div className="text-sm text-primary-500">Min (Median)</div>
              <div className="text-2xl font-bold text-died">
                {vitalStats.died.min.median?.toFixed(1) || 'N/A'}
              </div>
            </div>
            <div className="bg-died/10 rounded-lg p-4 text-center">
              <div className="text-sm text-primary-500">Mean (Median)</div>
              <div className="text-2xl font-bold text-died">
                {vitalStats.died.mean.median?.toFixed(1) || 'N/A'}
              </div>
            </div>
            <div className="bg-died/10 rounded-lg p-4 text-center">
              <div className="text-sm text-primary-500">Max (Median)</div>
              <div className="text-2xl font-bold text-died">
                {vitalStats.died.max.median?.toFixed(1) || 'N/A'}
              </div>
            </div>
          </div>
          {currentVital.normalMin && (
            <div className="mt-3 text-sm text-primary-500">
              Normal range: {currentVital.normalMin} - {currentVital.normalMax} {currentVital.unit}
            </div>
          )}
        </ChartContainer>
      </div>

      {/* Distribution Histogram */}
      <ChartContainer
        title={`${currentVital.label} Distribution`}
        subtitle="Histogram of mean values by outcome"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={histogramData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="bin" tick={{ fill: '#64748B', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="survived"
                name="Survived"
                stackId="1"
                stroke={COLORS.survived}
                fill={COLORS.survived}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="died"
                name="Died"
                stackId="1"
                stroke={COLORS.died}
                fill={COLORS.died}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Range Comparison */}
      <ChartContainer
        title="Min/Max/Mean Comparison"
        subtitle="Comparing vital sign ranges between outcomes"
        actions={
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showMean}
              onChange={(e) => setShowMean(e.target.checked)}
              className="rounded border-primary-300"
            />
            Show Mean Line
          </label>
        }
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rangeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="min" name="Min" fill={COLORS.primary} opacity={0.7} />
              <Bar dataKey="max" name="Max" fill={COLORS.secondary} opacity={0.7} />
              {showMean && (
                <Line
                  type="monotone"
                  dataKey="mean"
                  name="Mean"
                  stroke="#F39C12"
                  strokeWidth={3}
                  dot={{ fill: '#F39C12', strokeWidth: 2 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Abnormal Vital Signs Analysis */}
      <ChartContainer
        title="Abnormal Vital Signs Analysis"
        subtitle="Percentage of patients with values outside normal range and associated mortality"
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={abnormalAnalysis} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fill: '#64748B', fontSize: 11 }}
                width={100}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-primary-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                      <div className="font-medium border-b border-primary-600 pb-1 mb-1">
                        {data.name}
                      </div>
                      <div>Abnormal: {data.abnormalCount.toLocaleString()} patients</div>
                      <div>({data.abnormalPercent.toFixed(1)}% of cohort)</div>
                      <div className="text-died-light mt-1">
                        Mortality: {data.mortality.toFixed(1)}%
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar 
                dataKey="abnormalPercent" 
                name="% Abnormal" 
                fill={COLORS.primary}
                radius={[0, 4, 4, 0]}
              />
              <Line
                type="monotone"
                dataKey="mortality"
                name="Mortality %"
                stroke={COLORS.died}
                strokeWidth={2}
                dot={{ fill: COLORS.died }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 p-4 bg-primary-50 rounded-lg">
          <h4 className="font-medium text-primary-700 mb-2">Interpretation</h4>
          <p className="text-sm text-primary-500">
            This chart shows the percentage of patients with abnormal vital signs (outside normal range) 
            and the corresponding mortality rate for each group. Higher bars indicate more patients with 
            abnormal values; the line shows mortality rates for those groups.
          </p>
        </div>
      </ChartContainer>
    </div>
  );
}

