import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Users, Activity, Heart, Clock, AlertTriangle, Building2 } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { KPICard } from '../components/ui/KPICard';
import { ChartContainer } from '../components/charts/ChartContainer';
import { CustomTooltip, MortalityTooltip } from '../components/charts/CustomTooltip';
import { createAgeBins, calculateStats, calculateMortalityByGroup } from '../utils/dataLoader';

const COLORS = {
  survived: '#27AE60',
  died: '#E74C3C',
  primary: '#3498DB',
  secondary: '#148F77',
  chart: ['#3498DB', '#27AE60', '#E74C3C', '#F39C12', '#8B5CF6', '#148F77'],
};

export function SummaryPage() {
  const { filteredData } = useFilters();

  // Calculate KPIs
  const kpis = useMemo(() => {
    const total = filteredData.length;
    const died = filteredData.filter((p) => p.hospital_expire_flag === 1).length;
    const survived = total - died;
    const mortalityRate = total > 0 ? (died / total) * 100 : 0;

    const icuLos = calculateStats(filteredData.map((p) => p.los_icu));
    const hospitalLos = calculateStats(filteredData.map((p) => p.los_hospital));
    const ages = calculateStats(filteredData.map((p) => p.admission_age));

    return {
      total,
      survived,
      died,
      mortalityRate,
      avgIcuLos: icuLos.mean || 0,
      medianIcuLos: icuLos.median || 0,
      avgHospitalLos: hospitalLos.mean || 0,
      medianHospitalLos: hospitalLos.median || 0,
      avgAge: ages.mean || 0,
      medianAge: ages.median || 0,
    };
  }, [filteredData]);

  // Outcome distribution for pie chart
  const outcomeData = useMemo(() => [
    { name: 'Survived', value: kpis.survived, color: COLORS.survived },
    { name: 'Died', value: kpis.died, color: COLORS.died },
  ], [kpis]);

  // Age distribution with mortality
  const ageData = useMemo(() => createAgeBins(filteredData), [filteredData]);

  // Gender distribution
  const genderData = useMemo(() => calculateMortalityByGroup(filteredData, 'gender'), [filteredData]);

  // Admission type distribution
  const admissionData = useMemo(() => 
    calculateMortalityByGroup(filteredData, 'admission_type').slice(0, 6), 
    [filteredData]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Total Patients"
          value={kpis.total.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
          subtitle="Unique ICU stays"
          variant="info"
        />
        <KPICard
          title="Survived"
          value={kpis.survived.toLocaleString()}
          icon={<Heart className="w-5 h-5" />}
          subtitle={`${((kpis.survived / kpis.total) * 100 || 0).toFixed(1)}% of total`}
          variant="positive"
        />
        <KPICard
          title="Mortality Rate"
          value={`${kpis.mortalityRate.toFixed(1)}%`}
          icon={<AlertTriangle className="w-5 h-5" />}
          subtitle={`${kpis.died.toLocaleString()} patients`}
          variant="negative"
          tooltip="In-hospital mortality rate"
        />
        <KPICard
          title="Avg ICU LOS"
          value={`${kpis.avgIcuLos.toFixed(1)}d`}
          icon={<Activity className="w-5 h-5" />}
          subtitle={`Median: ${kpis.medianIcuLos.toFixed(1)}d`}
          tooltip="Average ICU length of stay in days"
        />
        <KPICard
          title="Avg Hospital LOS"
          value={`${kpis.avgHospitalLos.toFixed(1)}d`}
          icon={<Building2 className="w-5 h-5" />}
          subtitle={`Median: ${kpis.medianHospitalLos.toFixed(1)}d`}
          tooltip="Average hospital length of stay in days"
        />
        <KPICard
          title="Average Age"
          value={kpis.avgAge.toFixed(0)}
          icon={<Clock className="w-5 h-5" />}
          subtitle={`Median: ${kpis.medianAge.toFixed(0)} years`}
          tooltip="Average patient age at admission"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outcome Distribution */}
        <ChartContainer
          title="Outcome Distribution"
          subtitle="Hospital mortality"
          tooltip="Click segments to filter by outcome"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  labelLine={false}
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>

        {/* Age Distribution */}
        <ChartContainer
          title="Age Distribution"
          subtitle="By mortality status"
          className="lg:col-span-2"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} barGap={0}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="bin" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip content={<MortalityTooltip />} />
                <Legend />
                <Bar dataKey="survived" name="Survived" fill={COLORS.survived} radius={[4, 4, 0, 0]} />
                <Bar dataKey="died" name="Died" fill={COLORS.died} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <ChartContainer
          title="Gender Distribution"
          subtitle="Mortality comparison by gender"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  tickFormatter={(v) => v === 'M' ? 'Male' : 'Female'}
                />
                <Tooltip content={<MortalityTooltip />} />
                <Legend />
                <Bar dataKey="survived" name="Survived" fill={COLORS.survived} stackId="a" />
                <Bar dataKey="died" name="Died" fill={COLORS.died} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>

        {/* Admission Type Distribution */}
        <ChartContainer
          title="Admission Type"
          subtitle="Patient distribution by admission type"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={admissionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  width={100}
                />
                <Tooltip content={<MortalityTooltip />} />
                <Legend />
                <Bar dataKey="survived" name="Survived" fill={COLORS.survived} stackId="a" />
                <Bar dataKey="died" name="Died" fill={COLORS.died} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>

      {/* ICU LOS Distribution */}
      <ChartContainer
        title="ICU Length of Stay Distribution"
        subtitle="Frequency distribution of ICU stays"
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={useMemo(() => {
                const bins = Array.from({ length: 20 }, (_, i) => ({
                  range: `${i * 2}-${(i + 1) * 2}`,
                  count: filteredData.filter(
                    (p) => p.los_icu >= i * 2 && p.los_icu < (i + 1) * 2
                  ).length,
                  survived: filteredData.filter(
                    (p) => p.los_icu >= i * 2 && p.los_icu < (i + 1) * 2 && p.hospital_expire_flag === 0
                  ).length,
                  died: filteredData.filter(
                    (p) => p.los_icu >= i * 2 && p.los_icu < (i + 1) * 2 && p.hospital_expire_flag === 1
                  ).length,
                }));
                return bins;
              }, [filteredData])}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="range" tick={{ fill: '#64748B', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip content={<MortalityTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="survived"
                name="Survived"
                stackId="1"
                stroke={COLORS.survived}
                fill={COLORS.survived}
                fillOpacity={0.8}
              />
              <Area
                type="monotone"
                dataKey="died"
                name="Died"
                stackId="1"
                stroke={COLORS.died}
                fill={COLORS.died}
                fillOpacity={0.8}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Quick Stats Table */}
      <ChartContainer title="Quick Statistics" subtitle="Key metrics summary">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary-200">
                <th className="text-left py-3 px-4 font-semibold text-primary-600">Metric</th>
                <th className="text-right py-3 px-4 font-semibold text-primary-600">Overall</th>
                <th className="text-right py-3 px-4 font-semibold text-survived">Survived</th>
                <th className="text-right py-3 px-4 font-semibold text-died">Died</th>
              </tr>
            </thead>
            <tbody>
              {[
                { 
                  label: 'Count', 
                  overall: kpis.total.toLocaleString(),
                  survived: kpis.survived.toLocaleString(),
                  died: kpis.died.toLocaleString(),
                },
                {
                  label: 'Avg Age',
                  overall: kpis.avgAge.toFixed(1),
                  survived: calculateStats(
                    filteredData.filter((p) => p.hospital_expire_flag === 0).map((p) => p.admission_age)
                  ).mean?.toFixed(1) || 'N/A',
                  died: calculateStats(
                    filteredData.filter((p) => p.hospital_expire_flag === 1).map((p) => p.admission_age)
                  ).mean?.toFixed(1) || 'N/A',
                },
                {
                  label: 'Avg ICU LOS',
                  overall: kpis.avgIcuLos.toFixed(1) + ' days',
                  survived: calculateStats(
                    filteredData.filter((p) => p.hospital_expire_flag === 0).map((p) => p.los_icu)
                  ).mean?.toFixed(1) + ' days' || 'N/A',
                  died: calculateStats(
                    filteredData.filter((p) => p.hospital_expire_flag === 1).map((p) => p.los_icu)
                  ).mean?.toFixed(1) + ' days' || 'N/A',
                },
                {
                  label: 'Avg Hospital LOS',
                  overall: kpis.avgHospitalLos.toFixed(1) + ' days',
                  survived: calculateStats(
                    filteredData.filter((p) => p.hospital_expire_flag === 0).map((p) => p.los_hospital)
                  ).mean?.toFixed(1) + ' days' || 'N/A',
                  died: calculateStats(
                    filteredData.filter((p) => p.hospital_expire_flag === 1).map((p) => p.los_hospital)
                  ).mean?.toFixed(1) + ' days' || 'N/A',
                },
              ].map((row, i) => (
                <tr key={i} className="border-b border-primary-100 hover:bg-primary-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-primary-700">{row.label}</td>
                  <td className="py-3 px-4 text-right font-mono text-primary-600">{row.overall}</td>
                  <td className="py-3 px-4 text-right font-mono text-survived">{row.survived}</td>
                  <td className="py-3 px-4 text-right font-mono text-died">{row.died}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>
    </div>
  );
}

