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
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
} from 'recharts';
import { Download, Settings } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { ChartContainer } from '../components/charts/ChartContainer';
import { exportToCSV, calculateStats, createHistogramData } from '../utils/dataLoader';

const COLORS = {
  survived: '#27AE60',
  died: '#E74C3C',
  primary: '#3498DB',
  secondary: '#8B5CF6',
};

// Available numeric columns
const NUMERIC_COLUMNS = [
  { key: 'admission_age', label: 'Age' },
  { key: 'los_icu', label: 'ICU LOS' },
  { key: 'los_hospital', label: 'Hospital LOS' },
  { key: 'heart_rate_mean', label: 'Heart Rate (Mean)' },
  { key: 'sbp_mean', label: 'Systolic BP (Mean)' },
  { key: 'dbp_mean', label: 'Diastolic BP (Mean)' },
  { key: 'resp_rate_mean', label: 'Resp Rate (Mean)' },
  { key: 'temperature_mean', label: 'Temperature (Mean)' },
  { key: 'spo2_mean', label: 'SpO2 (Mean)' },
  { key: 'wbc_max', label: 'WBC (Max)' },
  { key: 'hemoglobin_min', label: 'Hemoglobin (Min)' },
  { key: 'platelets_min', label: 'Platelets (Min)' },
  { key: 'creatinine_max', label: 'Creatinine (Max)' },
  { key: 'bun_max', label: 'BUN (Max)' },
  { key: 'lactate_max', label: 'Lactate (Max)' },
  { key: 'ph_min', label: 'pH (Min)' },
  { key: 'pao2fio2ratio_min', label: 'P/F Ratio (Min)' },
  { key: 'glucose_max', label: 'Glucose (Max)' },
  { key: 'sodium_min', label: 'Sodium (Min)' },
  { key: 'potassium_max', label: 'Potassium (Max)' },
];

// Available categorical columns
const CATEGORICAL_COLUMNS = [
  { key: 'gender', label: 'Gender' },
  { key: 'race', label: 'Race' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'admission_type', label: 'Admission Type' },
  { key: 'marital_status', label: 'Marital Status' },
  { key: 'hospital_expire_flag', label: 'Outcome' },
];

type ChartType = 'scatter' | 'histogram' | 'bar';

export function ExplorerPage() {
  const { filteredData } = useFilters();
  
  const [xAxis, setXAxis] = useState('admission_age');
  const [yAxis, setYAxis] = useState('los_icu');
  const [colorBy, setColorBy] = useState('hospital_expire_flag');
  const [chartType, setChartType] = useState<ChartType>('scatter');
  const [groupBy, setGroupBy] = useState('');

  // Generate scatter data
  const scatterData = useMemo(() => {
    if (chartType !== 'scatter') return [];
    
    return filteredData
      .filter((p) => {
        const xVal = p[xAxis as keyof typeof p];
        const yVal = p[yAxis as keyof typeof p];
        return xVal !== null && xVal !== undefined && !isNaN(Number(xVal)) &&
               yVal !== null && yVal !== undefined && !isNaN(Number(yVal));
      })
      .slice(0, 1000)
      .map((p) => {
        let colorValue = '';
        if (colorBy === 'hospital_expire_flag') {
          colorValue = p.hospital_expire_flag === 1 ? 'Died' : 'Survived';
        } else {
          colorValue = String(p[colorBy as keyof typeof p] || 'Unknown');
        }
        
        return {
          x: Number(p[xAxis as keyof typeof p]),
          y: Number(p[yAxis as keyof typeof p]),
          color: colorValue,
          ...p,
        };
      });
  }, [filteredData, xAxis, yAxis, colorBy, chartType]);

  // Generate histogram data
  const histogramData = useMemo(() => {
    if (chartType !== 'histogram') return [];
    
    const values = filteredData
      .map((p) => Number(p[xAxis as keyof typeof p]))
      .filter((v) => !isNaN(v));
    
    if (values.length === 0) return [];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = 20;
    const binWidth = (max - min) / binCount;
    
    return Array.from({ length: binCount }, (_, i) => {
      const binMin = min + i * binWidth;
      const binMax = min + (i + 1) * binWidth;
      const inBin = filteredData.filter((p) => {
        const val = Number(p[xAxis as keyof typeof p]);
        return val >= binMin && val < binMax;
      });
      
      return {
        bin: binMin.toFixed(1),
        count: inBin.length,
        survived: inBin.filter((p) => p.hospital_expire_flag === 0).length,
        died: inBin.filter((p) => p.hospital_expire_flag === 1).length,
      };
    });
  }, [filteredData, xAxis, chartType]);

  // Generate bar data
  const barData = useMemo(() => {
    if (chartType !== 'bar' || !groupBy) return [];
    
    const groups = new Map<string, typeof filteredData>();
    
    filteredData.forEach((p) => {
      const groupValue = String(p[groupBy as keyof typeof p] || 'Unknown');
      if (!groups.has(groupValue)) {
        groups.set(groupValue, []);
      }
      groups.get(groupValue)!.push(p);
    });
    
    return Array.from(groups.entries())
      .map(([name, patients]) => {
        const stats = calculateStats(patients.map((p) => Number(p[xAxis as keyof typeof p])));
        return {
          name,
          mean: stats.mean || 0,
          median: stats.median || 0,
          count: patients.length,
          survived: patients.filter((p) => p.hospital_expire_flag === 0).length,
          died: patients.filter((p) => p.hospital_expire_flag === 1).length,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [filteredData, xAxis, groupBy, chartType]);

  // Get unique color values
  const colorValues = useMemo(() => {
    const values = new Set<string>();
    scatterData.forEach((d) => values.add(d.color));
    return Array.from(values);
  }, [scatterData]);

  // Color palette
  const colorPalette: Record<string, string> = {
    'Survived': COLORS.survived,
    'Died': COLORS.died,
    'M': COLORS.primary,
    'F': COLORS.secondary,
  };

  const getColor = (value: string, index: number) => {
    if (colorPalette[value]) return colorPalette[value];
    const palette = ['#3498DB', '#27AE60', '#E74C3C', '#F39C12', '#8B5CF6', '#148F77', '#EC4899', '#6366F1'];
    return palette[index % palette.length];
  };

  const handleExport = () => {
    exportToCSV(filteredData, 'mimic_pneumonia_filtered.csv');
  };

  const xLabel = NUMERIC_COLUMNS.find((c) => c.key === xAxis)?.label || xAxis;
  const yLabel = NUMERIC_COLUMNS.find((c) => c.key === yAxis)?.label || yAxis;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-primary-800">Visualization Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Chart Type */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">Chart Type</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className="select-base"
            >
              <option value="scatter">Scatter Plot</option>
              <option value="histogram">Histogram</option>
              <option value="bar">Bar Chart</option>
            </select>
          </div>

          {/* X-Axis */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              {chartType === 'histogram' ? 'Variable' : 'X-Axis'}
            </label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="select-base"
            >
              {NUMERIC_COLUMNS.map((col) => (
                <option key={col.key} value={col.key}>{col.label}</option>
              ))}
            </select>
          </div>

          {/* Y-Axis (only for scatter) */}
          {chartType === 'scatter' && (
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">Y-Axis</label>
              <select
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
                className="select-base"
              >
                {NUMERIC_COLUMNS.map((col) => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Color By (only for scatter) */}
          {chartType === 'scatter' && (
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">Color By</label>
              <select
                value={colorBy}
                onChange={(e) => setColorBy(e.target.value)}
                className="select-base"
              >
                {CATEGORICAL_COLUMNS.map((col) => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Group By (only for bar) */}
          {chartType === 'bar' && (
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">Group By</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="select-base"
              >
                <option value="">Select...</option>
                {CATEGORICAL_COLUMNS.map((col) => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Export Button */}
          <div className="flex items-end">
            <button
              onClick={handleExport}
              className="btn-primary flex items-center gap-2 w-full justify-center"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ChartContainer
        title={
          chartType === 'scatter' ? `${xLabel} vs ${yLabel}` :
          chartType === 'histogram' ? `${xLabel} Distribution` :
          groupBy ? `${xLabel} by ${CATEGORICAL_COLUMNS.find((c) => c.key === groupBy)?.label}` : 'Select a group variable'
        }
        subtitle={
          chartType === 'scatter' 
            ? `Showing up to 1,000 data points, colored by ${CATEGORICAL_COLUMNS.find((c) => c.key === colorBy)?.label}`
            : chartType === 'histogram'
            ? `Distribution of ${filteredData.length.toLocaleString()} patients`
            : ''
        }
      >
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'scatter' ? (
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name={xLabel}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  label={{ value: xLabel, position: 'bottom', fill: '#64748B' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name={yLabel}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#64748B' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-primary-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                        <div>{xLabel}: {data.x?.toFixed(2)}</div>
                        <div>{yLabel}: {data.y?.toFixed(2)}</div>
                        <div>Category: {data.color}</div>
                        {data.subject_id && <div className="text-xs text-primary-300 mt-1">ID: {data.subject_id}</div>}
                      </div>
                    );
                  }}
                />
                <Legend />
                {colorValues.map((colorValue, index) => (
                  <Scatter
                    key={colorValue}
                    name={colorValue}
                    data={scatterData.filter((d) => d.color === colorValue)}
                    fill={getColor(colorValue, index)}
                    opacity={0.6}
                  />
                ))}
              </ScatterChart>
            ) : chartType === 'histogram' ? (
              <AreaChart data={histogramData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="bin" tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.[0]) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-primary-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                        <div className="font-medium border-b border-primary-600 pb-1 mb-1">
                          Value: {label}
                        </div>
                        <div>Total: {data.count}</div>
                        <div className="text-survived-light">Survived: {data.survived}</div>
                        <div className="text-died-light">Died: {data.died}</div>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="survived"
                  name="Survived"
                  stackId="1"
                  stroke={COLORS.survived}
                  fill={COLORS.survived}
                  fillOpacity={0.7}
                />
                <Area
                  type="monotone"
                  dataKey="died"
                  name="Died"
                  stackId="1"
                  stroke={COLORS.died}
                  fill={COLORS.died}
                  fillOpacity={0.7}
                />
              </AreaChart>
            ) : (
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  width={120}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-primary-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                        <div className="font-medium border-b border-primary-600 pb-1 mb-1">{data.name}</div>
                        <div>Count: {data.count.toLocaleString()}</div>
                        <div>Mean: {data.mean.toFixed(2)}</div>
                        <div>Median: {data.median.toFixed(2)}</div>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="mean" name="Mean" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Data Summary */}
      <ChartContainer
        title="Data Summary"
        subtitle={`Statistics for filtered dataset (${filteredData.length.toLocaleString()} records)`}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[xAxis, yAxis].filter(Boolean).map((col) => {
            const values = filteredData
              .map((p) => Number(p[col as keyof typeof p]))
              .filter((v) => !isNaN(v));
            const stats = calculateStats(values);
            const label = NUMERIC_COLUMNS.find((c) => c.key === col)?.label || col;
            
            return (
              <div key={col} className="bg-primary-50 rounded-lg p-4">
                <div className="text-sm font-medium text-primary-700 mb-2">{label}</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-primary-500">Min:</span>
                    <span className="font-mono">{stats.min?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-500">Max:</span>
                    <span className="font-mono">{stats.max?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-500">Mean:</span>
                    <span className="font-mono">{stats.mean?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-500">Median:</span>
                    <span className="font-mono">{stats.median?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-500">Count:</span>
                    <span className="font-mono">{stats.count.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ChartContainer>

      {/* Quick Insights */}
      <div className="card">
        <h3 className="font-semibold text-primary-800 mb-4">Quick Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-survived/10 rounded-lg p-4">
            <div className="font-medium text-survived-dark">Survivors</div>
            <div className="text-2xl font-bold text-survived">
              {filteredData.filter((p) => p.hospital_expire_flag === 0).length.toLocaleString()}
            </div>
            <div className="text-primary-500">
              {((filteredData.filter((p) => p.hospital_expire_flag === 0).length / filteredData.length) * 100).toFixed(1)}% of cohort
            </div>
          </div>
          <div className="bg-died/10 rounded-lg p-4">
            <div className="font-medium text-died-dark">Deceased</div>
            <div className="text-2xl font-bold text-died">
              {filteredData.filter((p) => p.hospital_expire_flag === 1).length.toLocaleString()}
            </div>
            <div className="text-primary-500">
              {((filteredData.filter((p) => p.hospital_expire_flag === 1).length / filteredData.length) * 100).toFixed(1)}% mortality
            </div>
          </div>
          <div className="bg-primary-100 rounded-lg p-4">
            <div className="font-medium text-primary-700">Total Records</div>
            <div className="text-2xl font-bold text-primary-800">
              {filteredData.length.toLocaleString()}
            </div>
            <div className="text-primary-500">
              After applying filters
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

