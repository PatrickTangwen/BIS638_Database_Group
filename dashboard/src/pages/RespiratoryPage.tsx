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
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { AlertTriangle, Info } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { ChartContainer } from '../components/charts/ChartContainer';
import { calculateStats } from '../utils/dataLoader';

const COLORS = {
  survived: '#27AE60',
  died: '#E74C3C',
  primary: '#3498DB',
  secondary: '#8B5CF6',
  warning: '#F39C12',
  severe: '#C0392B',
  moderate: '#E74C3C',
  mild: '#F39C12',
  normal: '#27AE60',
};

// ARDS severity thresholds based on P/F ratio
const ARDS_THRESHOLDS = {
  normal: 300,
  mild: 200,
  moderate: 100,
};

export function RespiratoryPage() {
  const { filteredData } = useFilters();
  const [pfThreshold, setPfThreshold] = useState(200);

  // P/F Ratio statistics
  const pfStats = useMemo(() => {
    const survivedData = filteredData.filter((p) => p.hospital_expire_flag === 0);
    const diedData = filteredData.filter((p) => p.hospital_expire_flag === 1);

    const getValues = (data: typeof filteredData) =>
      data
        .map((p) => p.pao2fio2ratio_min as number)
        .filter((v) => v !== null && !isNaN(v));

    return {
      survived: calculateStats(getValues(survivedData)),
      died: calculateStats(getValues(diedData)),
      all: calculateStats(getValues(filteredData)),
    };
  }, [filteredData]);

  // ARDS severity classification
  const ardsData = useMemo(() => {
    const withPF = filteredData.filter(
      (p) => p.pao2fio2ratio_min !== null && !isNaN(p.pao2fio2ratio_min as number)
    );

    const classify = (pf: number) => {
      if (pf >= ARDS_THRESHOLDS.normal) return 'No ARDS';
      if (pf >= ARDS_THRESHOLDS.mild) return 'Mild ARDS';
      if (pf >= ARDS_THRESHOLDS.moderate) return 'Moderate ARDS';
      return 'Severe ARDS';
    };

    const categories = ['No ARDS', 'Mild ARDS', 'Moderate ARDS', 'Severe ARDS'];
    
    return categories.map((cat) => {
      const patients = withPF.filter((p) => classify(p.pao2fio2ratio_min as number) === cat);
      const survived = patients.filter((p) => p.hospital_expire_flag === 0).length;
      const died = patients.filter((p) => p.hospital_expire_flag === 1).length;
      
      return {
        name: cat,
        total: patients.length,
        survived,
        died,
        mortalityRate: patients.length > 0 ? (died / patients.length) * 100 : 0,
      };
    });
  }, [filteredData]);

  // P/F Ratio distribution
  const pfDistribution = useMemo(() => {
    const withPF = filteredData.filter(
      (p) => p.pao2fio2ratio_min !== null && !isNaN(p.pao2fio2ratio_min as number)
    );

    const bins = [0, 50, 100, 150, 200, 250, 300, 350, 400, 500];
    
    return bins.slice(0, -1).map((binStart, i) => {
      const binEnd = bins[i + 1];
      const inBin = withPF.filter((p) => {
        const pf = p.pao2fio2ratio_min as number;
        return pf >= binStart && pf < binEnd;
      });

      return {
        bin: `${binStart}-${binEnd}`,
        survived: inBin.filter((p) => p.hospital_expire_flag === 0).length,
        died: inBin.filter((p) => p.hospital_expire_flag === 1).length,
        total: inBin.length,
      };
    });
  }, [filteredData]);

  // Lactate statistics
  const lactateStats = useMemo(() => {
    const survivedData = filteredData.filter((p) => p.hospital_expire_flag === 0);
    const diedData = filteredData.filter((p) => p.hospital_expire_flag === 1);

    const getValues = (data: typeof filteredData) =>
      data.map((p) => p.lactate_max as number).filter((v) => v !== null && !isNaN(v));

    return {
      survived: calculateStats(getValues(survivedData)),
      died: calculateStats(getValues(diedData)),
    };
  }, [filteredData]);

  // pH analysis
  const phData = useMemo(() => {
    const withPH = filteredData.filter(
      (p) => p.ph_min !== null && !isNaN(p.ph_min as number)
    );

    const classifyPH = (ph: number) => {
      if (ph < 7.35) return 'Acidosis';
      if (ph > 7.45) return 'Alkalosis';
      return 'Normal';
    };

    const categories = ['Acidosis', 'Normal', 'Alkalosis'];
    
    return categories.map((cat) => {
      const patients = withPH.filter((p) => classifyPH(p.ph_min as number) === cat);
      const survived = patients.filter((p) => p.hospital_expire_flag === 0).length;
      const died = patients.filter((p) => p.hospital_expire_flag === 1).length;
      
      return {
        name: cat,
        total: patients.length,
        survived,
        died,
        mortalityRate: patients.length > 0 ? (died / patients.length) * 100 : 0,
      };
    });
  }, [filteredData]);

  // Blood gas radar chart data
  const bloodGasRadar = useMemo(() => {
    const normalize = (value: number | null, min: number, max: number) => {
      if (value === null) return 0;
      return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    };

    const survivedData = filteredData.filter((p) => p.hospital_expire_flag === 0);
    const diedData = filteredData.filter((p) => p.hospital_expire_flag === 1);

    const getMedian = (data: typeof filteredData, key: keyof typeof filteredData[0]) => {
      const values = data
        .map((p) => p[key] as number)
        .filter((v) => v !== null && !isNaN(v))
        .sort((a, b) => a - b);
      return values.length > 0 ? values[Math.floor(values.length / 2)] : 0;
    };

    const metrics = [
      { name: 'pH', survived: getMedian(survivedData, 'ph_min'), died: getMedian(diedData, 'ph_min'), min: 7.0, max: 7.6 },
      { name: 'pO2', survived: getMedian(survivedData, 'po2_min'), died: getMedian(diedData, 'po2_min'), min: 30, max: 150 },
      { name: 'pCO2', survived: getMedian(survivedData, 'pco2_min'), died: getMedian(diedData, 'pco2_min'), min: 20, max: 80 },
      { name: 'Lactate', survived: getMedian(survivedData, 'lactate_max'), died: getMedian(diedData, 'lactate_max'), min: 0, max: 10 },
      { name: 'P/F Ratio', survived: getMedian(survivedData, 'pao2fio2ratio_min'), died: getMedian(diedData, 'pao2fio2ratio_min'), min: 50, max: 500 },
    ];

    return metrics.map((m) => ({
      subject: m.name,
      Survived: normalize(m.survived, m.min, m.max),
      Died: normalize(m.died, m.min, m.max),
      fullMark: 100,
    }));
  }, [filteredData]);

  // P/F threshold analysis
  const thresholdAnalysis = useMemo(() => {
    const withPF = filteredData.filter(
      (p) => p.pao2fio2ratio_min !== null && !isNaN(p.pao2fio2ratio_min as number)
    );

    const below = withPF.filter((p) => (p.pao2fio2ratio_min as number) < pfThreshold);
    const above = withPF.filter((p) => (p.pao2fio2ratio_min as number) >= pfThreshold);

    return {
      below: {
        count: below.length,
        survived: below.filter((p) => p.hospital_expire_flag === 0).length,
        died: below.filter((p) => p.hospital_expire_flag === 1).length,
        mortality: below.length > 0 
          ? (below.filter((p) => p.hospital_expire_flag === 1).length / below.length) * 100 
          : 0,
      },
      above: {
        count: above.length,
        survived: above.filter((p) => p.hospital_expire_flag === 0).length,
        died: above.filter((p) => p.hospital_expire_flag === 1).length,
        mortality: above.length > 0 
          ? (above.filter((p) => p.hospital_expire_flag === 1).length / above.length) * 100 
          : 0,
      },
    };
  }, [filteredData, pfThreshold]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* P/F Ratio Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-medical-blue" />
            <span className="text-sm font-medium text-primary-600">Overall P/F Ratio</span>
          </div>
          <div className="text-3xl font-bold text-primary-800">
            {pfStats.all.median?.toFixed(0) || 'N/A'}
          </div>
          <div className="text-sm text-primary-500">
            Range: {pfStats.all.min?.toFixed(0)} - {pfStats.all.max?.toFixed(0)}
          </div>
        </div>

        <div className="card bg-gradient-to-br from-survived/5 to-survived/15">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-survived-dark">Survived - P/F Ratio</span>
          </div>
          <div className="text-3xl font-bold text-survived">
            {pfStats.survived.median?.toFixed(0) || 'N/A'}
          </div>
          <div className="text-sm text-survived-dark">
            Median value
          </div>
        </div>

        <div className="card bg-gradient-to-br from-died/5 to-died/15">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-died" />
            <span className="text-sm font-medium text-died-dark">Deceased - P/F Ratio</span>
          </div>
          <div className="text-3xl font-bold text-died">
            {pfStats.died.median?.toFixed(0) || 'N/A'}
          </div>
          <div className="text-sm text-died-dark">
            Median value
          </div>
        </div>
      </div>

      {/* P/F Ratio Distribution with ARDS thresholds */}
      <ChartContainer
        title="P/F Ratio Distribution"
        subtitle="With ARDS severity thresholds highlighted"
        tooltip="PaO2/FiO2 ratio is a key measure of oxygenation. Lower values indicate worse lung function."
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pfDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="bin" tick={{ fill: '#64748B', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.[0]) return null;
                  const data = payload[0].payload;
                  const mortality = data.total > 0 ? (data.died / data.total) * 100 : 0;
                  return (
                    <div className="bg-primary-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                      <div className="font-medium border-b border-primary-600 pb-1 mb-1">
                        P/F Ratio: {label}
                      </div>
                      <div>Total: {data.total}</div>
                      <div className="text-survived-light">Survived: {data.survived}</div>
                      <div className="text-died-light">Died: {data.died}</div>
                      <div className="font-medium mt-1">Mortality: {mortality.toFixed(1)}%</div>
                    </div>
                  );
                }}
              />
              <Legend />
              {/* Reference lines for ARDS thresholds */}
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
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.severe }} />
            <span>Severe ARDS (&lt;100)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.moderate }} />
            <span>Moderate (100-200)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.mild }} />
            <span>Mild (200-300)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.normal }} />
            <span>Normal (&ge;300)</span>
          </div>
        </div>
      </ChartContainer>

      {/* ARDS Severity Classification */}
      <ChartContainer
        title="ARDS Severity Classification"
        subtitle="Based on Berlin Definition P/F ratio thresholds"
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ardsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-primary-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                      <div className="font-medium border-b border-primary-600 pb-1 mb-1">{data.name}</div>
                      <div>Total: {data.total.toLocaleString()}</div>
                      <div className="text-survived-light">Survived: {data.survived}</div>
                      <div className="text-died-light">Died: {data.died}</div>
                      <div className="font-medium text-died-light mt-1">
                        Mortality: {data.mortalityRate.toFixed(1)}%
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar dataKey="survived" name="Survived" fill={COLORS.survived} stackId="a" />
              <Bar dataKey="died" name="Died" fill={COLORS.died} stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lactate Analysis */}
        <ChartContainer
          title="Lactate Levels by Outcome"
          subtitle="Max lactate during ICU stay (mmol/L)"
          tooltip="Lactate is a marker of tissue hypoxia. Higher values indicate worse perfusion."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-survived/10 rounded-lg p-4">
                <div className="text-sm text-primary-500">Survived</div>
                <div className="text-2xl font-bold text-survived">
                  {lactateStats.survived.median?.toFixed(1) || 'N/A'}
                </div>
                <div className="text-xs text-primary-400">
                  Range: {lactateStats.survived.min?.toFixed(1)} - {lactateStats.survived.max?.toFixed(1)}
                </div>
              </div>
              <div className="bg-died/10 rounded-lg p-4">
                <div className="text-sm text-primary-500">Deceased</div>
                <div className="text-2xl font-bold text-died">
                  {lactateStats.died.median?.toFixed(1) || 'N/A'}
                </div>
                <div className="text-xs text-primary-400">
                  Range: {lactateStats.died.min?.toFixed(1)} - {lactateStats.died.max?.toFixed(1)}
                </div>
              </div>
            </div>
            <div className="text-sm text-primary-500 p-3 bg-primary-50 rounded-lg">
              <strong>Clinical Note:</strong> Lactate &gt; 2 mmol/L may indicate hypoperfusion. 
              Lactate &gt; 4 mmol/L is associated with significantly increased mortality.
            </div>
          </div>
        </ChartContainer>

        {/* pH Analysis */}
        <ChartContainer
          title="Blood pH Distribution"
          subtitle="Acid-base status by outcome"
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-primary-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                        <div className="font-medium">{data.name}</div>
                        <div>Total: {data.total}</div>
                        <div className="text-died-light">Mortality: {data.mortalityRate.toFixed(1)}%</div>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="survived" name="Survived" fill={COLORS.survived} stackId="a" />
                <Bar dataKey="died" name="Died" fill={COLORS.died} stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-sm text-primary-500">
            Normal pH range: 7.35 - 7.45
          </div>
        </ChartContainer>
      </div>

      {/* Blood Gas Radar Comparison */}
      <ChartContainer
        title="Blood Gas Profile Comparison"
        subtitle="Normalized comparison of blood gas values between outcomes"
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={bloodGasRadar}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 12 }} />
              <PolarRadiusAxis tick={{ fill: '#64748B', fontSize: 10 }} />
              <Radar
                name="Survived"
                dataKey="Survived"
                stroke={COLORS.survived}
                fill={COLORS.survived}
                fillOpacity={0.4}
              />
              <Radar
                name="Died"
                dataKey="Died"
                stroke={COLORS.died}
                fill={COLORS.died}
                fillOpacity={0.4}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-sm text-primary-500">
          Values normalized to 0-100 scale for comparison. Higher values indicate values towards the upper normal range.
        </div>
      </ChartContainer>

      {/* ARDS Calculator / P/F Threshold Tool */}
      <ChartContainer
        title="P/F Ratio Threshold Explorer"
        subtitle="Analyze mortality rates above and below custom thresholds"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-primary-600">
              P/F Ratio Threshold:
            </label>
            <input
              type="range"
              min="50"
              max="400"
              step="10"
              value={pfThreshold}
              onChange={(e) => setPfThreshold(parseInt(e.target.value))}
              className="flex-1 h-2 bg-primary-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-lg font-bold text-primary-800 w-16 text-center">
              {pfThreshold}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPfThreshold(100)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                pfThreshold === 100 ? 'bg-died text-white' : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
              }`}
            >
              Severe (&lt;100)
            </button>
            <button
              onClick={() => setPfThreshold(200)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                pfThreshold === 200 ? 'bg-medical-amber text-white' : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
              }`}
            >
              Moderate (&lt;200)
            </button>
            <button
              onClick={() => setPfThreshold(300)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                pfThreshold === 300 ? 'bg-survived text-white' : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
              }`}
            >
              Mild (&lt;300)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-died/10 rounded-lg p-4 border-l-4 border-died">
              <div className="text-lg font-semibold text-primary-700">
                P/F Ratio &lt; {pfThreshold}
              </div>
              <div className="mt-2 space-y-1">
                <div className="text-sm">Patients: {thresholdAnalysis.below.count.toLocaleString()}</div>
                <div className="text-sm text-survived">Survived: {thresholdAnalysis.below.survived.toLocaleString()}</div>
                <div className="text-sm text-died">Died: {thresholdAnalysis.below.died.toLocaleString()}</div>
                <div className="text-xl font-bold text-died mt-2">
                  Mortality: {thresholdAnalysis.below.mortality.toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="bg-survived/10 rounded-lg p-4 border-l-4 border-survived">
              <div className="text-lg font-semibold text-primary-700">
                P/F Ratio &ge; {pfThreshold}
              </div>
              <div className="mt-2 space-y-1">
                <div className="text-sm">Patients: {thresholdAnalysis.above.count.toLocaleString()}</div>
                <div className="text-sm text-survived">Survived: {thresholdAnalysis.above.survived.toLocaleString()}</div>
                <div className="text-sm text-died">Died: {thresholdAnalysis.above.died.toLocaleString()}</div>
                <div className="text-xl font-bold text-survived mt-2">
                  Mortality: {thresholdAnalysis.above.mortality.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </ChartContainer>
    </div>
  );
}

