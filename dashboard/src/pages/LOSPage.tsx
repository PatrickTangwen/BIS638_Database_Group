import { useMemo } from 'react';
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
  ScatterChart,
  Scatter,
  ComposedChart,
  Line,
} from 'recharts';
import { Clock, Building2, Activity, TrendingUp } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { ChartContainer } from '../components/charts/ChartContainer';
import { KPICard } from '../components/ui/KPICard';
import { calculateStats, calculateMortalityByGroup } from '../utils/dataLoader';

const COLORS = {
  survived: '#27AE60',
  died: '#E74C3C',
  primary: '#3498DB',
  secondary: '#8B5CF6',
  icu: '#148F77',
  hospital: '#F39C12',
};

export function LOSPage() {
  const { filteredData } = useFilters();

  // LOS statistics
  const losStats = useMemo(() => {
    const icuLos = calculateStats(filteredData.map((p) => p.los_icu));
    const hospitalLos = calculateStats(filteredData.map((p) => p.los_hospital));

    const survivedICU = calculateStats(
      filteredData.filter((p) => p.hospital_expire_flag === 0).map((p) => p.los_icu)
    );
    const diedICU = calculateStats(
      filteredData.filter((p) => p.hospital_expire_flag === 1).map((p) => p.los_icu)
    );

    const survivedHospital = calculateStats(
      filteredData.filter((p) => p.hospital_expire_flag === 0).map((p) => p.los_hospital)
    );
    const diedHospital = calculateStats(
      filteredData.filter((p) => p.hospital_expire_flag === 1).map((p) => p.los_hospital)
    );

    return {
      icu: icuLos,
      hospital: hospitalLos,
      survivedICU,
      diedICU,
      survivedHospital,
      diedHospital,
    };
  }, [filteredData]);

  // ICU LOS distribution
  const icuLosDistribution = useMemo(() => {
    const bins = [0, 1, 2, 3, 5, 7, 10, 14, 21, 30, 100];
    
    return bins.slice(0, -1).map((binStart, i) => {
      const binEnd = bins[i + 1];
      const label = binEnd === 100 ? `${binStart}+` : `${binStart}-${binEnd}`;
      const inBin = filteredData.filter((p) => p.los_icu >= binStart && p.los_icu < binEnd);
      
      return {
        bin: label,
        survived: inBin.filter((p) => p.hospital_expire_flag === 0).length,
        died: inBin.filter((p) => p.hospital_expire_flag === 1).length,
        total: inBin.length,
      };
    });
  }, [filteredData]);

  // Hospital LOS distribution
  const hospitalLosDistribution = useMemo(() => {
    const bins = [0, 3, 7, 14, 21, 30, 45, 60, 90, 200];
    
    return bins.slice(0, -1).map((binStart, i) => {
      const binEnd = bins[i + 1];
      const label = binEnd === 200 ? `${binStart}+` : `${binStart}-${binEnd}`;
      const inBin = filteredData.filter((p) => p.los_hospital >= binStart && p.los_hospital < binEnd);
      
      return {
        bin: label,
        survived: inBin.filter((p) => p.hospital_expire_flag === 0).length,
        died: inBin.filter((p) => p.hospital_expire_flag === 1).length,
        total: inBin.length,
      };
    });
  }, [filteredData]);

  // LOS by demographics
  const losByGender = useMemo(() => {
    const male = filteredData.filter((p) => p.gender === 'M');
    const female = filteredData.filter((p) => p.gender === 'F');

    return [
      {
        name: 'Male',
        icuMean: calculateStats(male.map((p) => p.los_icu)).mean || 0,
        hospitalMean: calculateStats(male.map((p) => p.los_hospital)).mean || 0,
        count: male.length,
      },
      {
        name: 'Female',
        icuMean: calculateStats(female.map((p) => p.los_icu)).mean || 0,
        hospitalMean: calculateStats(female.map((p) => p.los_hospital)).mean || 0,
        count: female.length,
      },
    ];
  }, [filteredData]);

  // LOS by age group
  const losByAge = useMemo(() => {
    const bins = [
      { label: '18-40', min: 18, max: 40 },
      { label: '41-60', min: 41, max: 60 },
      { label: '61-70', min: 61, max: 70 },
      { label: '71-80', min: 71, max: 80 },
      { label: '80+', min: 80, max: 200 },
    ];

    return bins.map(({ label, min, max }) => {
      const inBin = filteredData.filter((p) => p.admission_age >= min && p.admission_age <= max);
      return {
        name: label,
        icuMean: calculateStats(inBin.map((p) => p.los_icu)).mean || 0,
        hospitalMean: calculateStats(inBin.map((p) => p.los_hospital)).mean || 0,
        count: inBin.length,
      };
    });
  }, [filteredData]);

  // ICU vs Hospital LOS scatter
  const losScatter = useMemo(() => {
    return filteredData
      .filter((p) => p.los_icu !== null && p.los_hospital !== null)
      .slice(0, 500)
      .map((p) => ({
        icuLos: p.los_icu,
        hospitalLos: p.los_hospital,
        outcome: p.hospital_expire_flag === 1 ? 'Died' : 'Survived',
        color: p.hospital_expire_flag === 1 ? COLORS.died : COLORS.survived,
      }));
  }, [filteredData]);

  // Percentile table data
  const percentileData = useMemo(() => {
    const getPercentile = (values: number[], p: number) => {
      const sorted = values.filter((v) => v !== null && !isNaN(v)).sort((a, b) => a - b);
      if (sorted.length === 0) return 0;
      const idx = Math.floor(sorted.length * (p / 100));
      return sorted[idx] || 0;
    };

    const icuValues = filteredData.map((p) => p.los_icu).filter((v) => v !== null) as number[];
    const hospitalValues = filteredData.map((p) => p.los_hospital).filter((v) => v !== null) as number[];

    return [
      { percentile: '25th', icu: getPercentile(icuValues, 25), hospital: getPercentile(hospitalValues, 25) },
      { percentile: '50th (Median)', icu: getPercentile(icuValues, 50), hospital: getPercentile(hospitalValues, 50) },
      { percentile: '75th', icu: getPercentile(icuValues, 75), hospital: getPercentile(hospitalValues, 75) },
      { percentile: '90th', icu: getPercentile(icuValues, 90), hospital: getPercentile(hospitalValues, 90) },
    ];
  }, [filteredData]);

  // LOS vs Mortality
  const losMortality = useMemo(() => {
    const bins = [
      { label: '0-1 day', min: 0, max: 1 },
      { label: '1-3 days', min: 1, max: 3 },
      { label: '3-7 days', min: 3, max: 7 },
      { label: '7-14 days', min: 7, max: 14 },
      { label: '14-30 days', min: 14, max: 30 },
      { label: '30+ days', min: 30, max: 1000 },
    ];

    return bins.map(({ label, min, max }) => {
      const inBin = filteredData.filter((p) => p.los_icu >= min && p.los_icu < max);
      const died = inBin.filter((p) => p.hospital_expire_flag === 1).length;
      return {
        name: label,
        count: inBin.length,
        mortality: inBin.length > 0 ? (died / inBin.length) * 100 : 0,
      };
    });
  }, [filteredData]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Avg ICU LOS"
          value={`${losStats.icu.mean?.toFixed(1) || 0} days`}
          icon={<Activity className="w-5 h-5" />}
          subtitle={`Median: ${losStats.icu.median?.toFixed(1) || 0} days`}
          variant="info"
        />
        <KPICard
          title="Avg Hospital LOS"
          value={`${losStats.hospital.mean?.toFixed(1) || 0} days`}
          icon={<Building2 className="w-5 h-5" />}
          subtitle={`Median: ${losStats.hospital.median?.toFixed(1) || 0} days`}
        />
        <KPICard
          title="ICU LOS (Survived)"
          value={`${losStats.survivedICU.mean?.toFixed(1) || 0} days`}
          icon={<TrendingUp className="w-5 h-5" />}
          subtitle={`Median: ${losStats.survivedICU.median?.toFixed(1) || 0} days`}
          variant="positive"
        />
        <KPICard
          title="ICU LOS (Died)"
          value={`${losStats.diedICU.mean?.toFixed(1) || 0} days`}
          icon={<Clock className="w-5 h-5" />}
          subtitle={`Median: ${losStats.diedICU.median?.toFixed(1) || 0} days`}
          variant="negative"
        />
      </div>

      {/* ICU LOS Distribution */}
      <ChartContainer
        title="ICU Length of Stay Distribution"
        subtitle="Distribution by outcome"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={icuLosDistribution}>
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
                        ICU LOS: {label} days
                      </div>
                      <div>Total: {data.total.toLocaleString()}</div>
                      <div className="text-survived-light">Survived: {data.survived}</div>
                      <div className="text-died-light">Died: {data.died}</div>
                      <div className="font-medium mt-1">Mortality: {mortality.toFixed(1)}%</div>
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
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Hospital LOS Distribution */}
      <ChartContainer
        title="Hospital Length of Stay Distribution"
        subtitle="Distribution by outcome"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hospitalLosDistribution}>
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
                        Hospital LOS: {label} days
                      </div>
                      <div>Total: {data.total.toLocaleString()}</div>
                      <div className="text-survived-light">Survived: {data.survived}</div>
                      <div className="text-died-light">Died: {data.died}</div>
                      <div className="font-medium mt-1">Mortality: {mortality.toFixed(1)}%</div>
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
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LOS by Gender */}
        <ChartContainer
          title="Average LOS by Gender"
          subtitle="ICU and Hospital stay comparison"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={losByGender}>
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
                        <div>Patients: {data.count.toLocaleString()}</div>
                        <div>Avg ICU LOS: {data.icuMean.toFixed(1)} days</div>
                        <div>Avg Hospital LOS: {data.hospitalMean.toFixed(1)} days</div>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="icuMean" name="ICU LOS" fill={COLORS.icu} radius={[4, 4, 0, 0]} />
                <Bar dataKey="hospitalMean" name="Hospital LOS" fill={COLORS.hospital} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>

        {/* LOS by Age */}
        <ChartContainer
          title="Average LOS by Age Group"
          subtitle="ICU and Hospital stay comparison"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={losByAge}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-primary-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                        <div className="font-medium border-b border-primary-600 pb-1 mb-1">Age: {data.name}</div>
                        <div>Patients: {data.count.toLocaleString()}</div>
                        <div>Avg ICU LOS: {data.icuMean.toFixed(1)} days</div>
                        <div>Avg Hospital LOS: {data.hospitalMean.toFixed(1)} days</div>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="icuMean" name="ICU LOS" fill={COLORS.icu} radius={[4, 4, 0, 0]} />
                <Bar dataKey="hospitalMean" name="Hospital LOS" fill={COLORS.hospital} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>

      {/* ICU vs Hospital LOS Scatter */}
      <ChartContainer
        title="ICU vs Hospital Length of Stay"
        subtitle="Relationship colored by outcome (sample of 500)"
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                type="number" 
                dataKey="icuLos" 
                name="ICU LOS" 
                tick={{ fill: '#64748B', fontSize: 12 }}
                label={{ value: 'ICU LOS (days)', position: 'bottom', fill: '#64748B' }}
              />
              <YAxis 
                type="number" 
                dataKey="hospitalLos" 
                name="Hospital LOS" 
                tick={{ fill: '#64748B', fontSize: 12 }}
                label={{ value: 'Hospital LOS (days)', angle: -90, position: 'insideLeft', fill: '#64748B' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-primary-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                      <div>ICU LOS: {data.icuLos?.toFixed(1)} days</div>
                      <div>Hospital LOS: {data.hospitalLos?.toFixed(1)} days</div>
                      <div style={{ color: data.color }}>{data.outcome}</div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Scatter
                name="Survived"
                data={losScatter.filter((d) => d.outcome === 'Survived')}
                fill={COLORS.survived}
                opacity={0.6}
              />
              <Scatter
                name="Died"
                data={losScatter.filter((d) => d.outcome === 'Died')}
                fill={COLORS.died}
                opacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Percentiles Table and LOS Mortality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Percentile Table */}
        <ChartContainer
          title="LOS Percentiles"
          subtitle="Distribution percentiles for ICU and Hospital stays"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary-200">
                <th className="text-left py-3 px-4 font-semibold text-primary-600">Percentile</th>
                <th className="text-right py-3 px-4 font-semibold text-primary-600">ICU LOS</th>
                <th className="text-right py-3 px-4 font-semibold text-primary-600">Hospital LOS</th>
              </tr>
            </thead>
            <tbody>
              {percentileData.map((row) => (
                <tr key={row.percentile} className="border-b border-primary-100 hover:bg-primary-50">
                  <td className="py-3 px-4 font-medium text-primary-700">{row.percentile}</td>
                  <td className="py-3 px-4 text-right font-mono text-primary-600">{row.icu.toFixed(1)} days</td>
                  <td className="py-3 px-4 text-right font-mono text-primary-600">{row.hospital.toFixed(1)} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ChartContainer>

        {/* LOS vs Mortality */}
        <ChartContainer
          title="ICU LOS vs Mortality Rate"
          subtitle="Mortality rate by length of stay"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={losMortality}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-primary-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                        <div className="font-medium">{data.name}</div>
                        <div>Patients: {data.count.toLocaleString()}</div>
                        <div className="text-died-light">Mortality: {data.mortality.toFixed(1)}%</div>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="Patient Count" fill={COLORS.primary} opacity={0.7} />
                <Line
                  yAxisId="right"
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
        </ChartContainer>
      </div>
    </div>
  );
}

