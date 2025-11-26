import { useMemo, useState } from 'react';
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
} from 'recharts';
import { useFilters } from '../context/FilterContext';
import { ChartContainer } from '../components/charts/ChartContainer';
import { MortalityTooltip, CustomTooltip } from '../components/charts/CustomTooltip';
import { calculateMortalityByGroup, createAgeBins } from '../utils/dataLoader';

const COLORS = {
  survived: '#27AE60',
  died: '#E74C3C',
  chart: ['#3498DB', '#27AE60', '#8B5CF6', '#F39C12', '#E74C3C', '#148F77', '#6366F1', '#EC4899'],
};

export function DemographicsPage() {
  const { filteredData, updateFilter } = useFilters();
  const [selectedDemographic, setSelectedDemographic] = useState<'race' | 'insurance' | 'marital_status'>('race');

  // Age distribution with mortality
  const ageData = useMemo(() => createAgeBins(filteredData), [filteredData]);

  // Gender data
  const genderData = useMemo(() => {
    const male = filteredData.filter((p) => p.gender === 'M');
    const female = filteredData.filter((p) => p.gender === 'F');
    return [
      { 
        name: 'Male', 
        total: male.length, 
        survived: male.filter((p) => p.hospital_expire_flag === 0).length,
        died: male.filter((p) => p.hospital_expire_flag === 1).length,
        mortalityRate: male.length > 0 ? male.filter((p) => p.hospital_expire_flag === 1).length / male.length : 0,
      },
      { 
        name: 'Female', 
        total: female.length,
        survived: female.filter((p) => p.hospital_expire_flag === 0).length,
        died: female.filter((p) => p.hospital_expire_flag === 1).length,
        mortalityRate: female.length > 0 ? female.filter((p) => p.hospital_expire_flag === 1).length / female.length : 0,
      },
    ];
  }, [filteredData]);

  // Race/Ethnicity data
  const raceData = useMemo(() => 
    calculateMortalityByGroup(filteredData, 'race').slice(0, 10), 
    [filteredData]
  );

  // Insurance data
  const insuranceData = useMemo(() => 
    calculateMortalityByGroup(filteredData, 'insurance'), 
    [filteredData]
  );

  // Marital Status data
  const maritalData = useMemo(() => 
    calculateMortalityByGroup(filteredData, 'marital_status').filter((d) => d.name !== ''), 
    [filteredData]
  );

  // Language data
  const languageData = useMemo(() => 
    calculateMortalityByGroup(filteredData, 'language').slice(0, 8), 
    [filteredData]
  );

  // Disparity analysis data
  const disparityData = useMemo(() => {
    const demographicMap = {
      race: raceData,
      insurance: insuranceData,
      marital_status: maritalData,
    };
    return demographicMap[selectedDemographic].map((d) => ({
      ...d,
      mortalityPercent: d.mortalityRate * 100,
    }));
  }, [selectedDemographic, raceData, insuranceData, maritalData]);

  const handleBarClick = (data: { name: string }) => {
    if (data?.name) {
      updateFilter('race', [data.name]);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Gender and Age Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Breakdown */}
        <ChartContainer
          title="Gender Distribution"
          subtitle="Click bars to filter by gender"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip content={<MortalityTooltip />} />
                <Legend />
                <Bar 
                  dataKey="survived" 
                  name="Survived" 
                  fill={COLORS.survived} 
                  stackId="a"
                  radius={[0, 0, 0, 0]}
                  onClick={(data) => updateFilter('gender', [data.name === 'Male' ? 'M' : 'F'])}
                  className="cursor-pointer"
                />
                <Bar 
                  dataKey="died" 
                  name="Died" 
                  fill={COLORS.died} 
                  stackId="a"
                  radius={[4, 4, 0, 0]}
                  onClick={(data) => updateFilter('gender', [data.name === 'Male' ? 'M' : 'F'])}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {genderData.map((g) => (
              <div key={g.name} className="bg-primary-50 rounded-lg p-3">
                <div className="font-medium text-primary-700">{g.name}</div>
                <div className="text-primary-500">{g.total.toLocaleString()} patients</div>
                <div className="text-died font-medium">{(g.mortalityRate * 100).toFixed(1)}% mortality</div>
              </div>
            ))}
          </div>
        </ChartContainer>

        {/* Age Distribution */}
        <ChartContainer
          title="Age Distribution with Survival"
          subtitle="Stacked by outcome"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="bin" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip content={<MortalityTooltip />} />
                <Legend />
                <Bar dataKey="survived" name="Survived" fill={COLORS.survived} stackId="a" />
                <Bar dataKey="died" name="Died" fill={COLORS.died} stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-primary-500">
            <span className="font-medium">Note:</span> Age 91 represents patients 89 years or older (de-identified)
          </div>
        </ChartContainer>
      </div>

      {/* Race/Ethnicity Chart */}
      <ChartContainer
        title="Race/Ethnicity Distribution"
        subtitle="Click bars to filter by race"
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={raceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fill: '#64748B', fontSize: 11 }}
                width={180}
              />
              <Tooltip content={<MortalityTooltip />} />
              <Legend />
              <Bar 
                dataKey="survived" 
                name="Survived" 
                fill={COLORS.survived} 
                stackId="a"
                onClick={handleBarClick}
                className="cursor-pointer"
              />
              <Bar 
                dataKey="died" 
                name="Died" 
                fill={COLORS.died} 
                stackId="a"
                radius={[0, 4, 4, 0]}
                onClick={handleBarClick}
                className="cursor-pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Insurance and Language Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insurance Distribution */}
        <ChartContainer
          title="Insurance Type Distribution"
          subtitle="Patient count by insurance type"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insuranceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  width={80}
                />
                <Tooltip content={<MortalityTooltip />} />
                <Legend />
                <Bar dataKey="survived" name="Survived" fill={COLORS.survived} stackId="a" />
                <Bar dataKey="died" name="Died" fill={COLORS.died} stackId="a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>

        {/* Marital Status */}
        <ChartContainer
          title="Marital Status Distribution"
          subtitle="With mortality rates"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={maritalData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  dataKey="total"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#94A3B8' }}
                >
                  {maritalData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-primary-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                        <div className="font-medium">{data.name}</div>
                        <div>Total: {data.total.toLocaleString()}</div>
                        <div className="text-died-light">Mortality: {(data.mortalityRate * 100).toFixed(1)}%</div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>

      {/* Disparity Analysis Tool */}
      <ChartContainer
        title="Disparity Analysis Tool"
        subtitle="Compare mortality rates across demographic groups"
        actions={
          <select
            value={selectedDemographic}
            onChange={(e) => setSelectedDemographic(e.target.value as typeof selectedDemographic)}
            className="select-base w-40 text-sm"
          >
            <option value="race">Race/Ethnicity</option>
            <option value="insurance">Insurance Type</option>
            <option value="marital_status">Marital Status</option>
          </select>
        }
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={disparityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                type="number" 
                tick={{ fill: '#64748B', fontSize: 12 }} 
                tickFormatter={(v) => `${v}%`}
                domain={[0, 'dataMax + 5']}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fill: '#64748B', fontSize: 11 }}
                width={150}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-primary-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                      <div className="font-medium border-b border-primary-600 pb-1 mb-1">{data.name}</div>
                      <div>Total: {data.total.toLocaleString()}</div>
                      <div className="text-survived-light">Survived: {data.survived.toLocaleString()}</div>
                      <div className="text-died-light">Died: {data.died.toLocaleString()}</div>
                      <div className="font-medium mt-1 pt-1 border-t border-primary-600">
                        Mortality: {data.mortalityPercent.toFixed(1)}%
                      </div>
                    </div>
                  );
                }}
              />
              <Bar 
                dataKey="mortalityPercent" 
                name="Mortality Rate (%)" 
                fill={COLORS.died}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 p-4 bg-primary-50 rounded-lg">
          <h4 className="font-medium text-primary-700 mb-2">Statistical Note</h4>
          <p className="text-sm text-primary-500">
            Mortality rate disparities may reflect differences in underlying health conditions, 
            access to care, treatment timing, and social determinants of health. Statistical 
            significance should be calculated separately for comparative studies.
          </p>
        </div>
      </ChartContainer>

      {/* Language Distribution */}
      <ChartContainer
        title="Primary Language Distribution"
        subtitle="Top 8 languages spoken by patients"
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={languageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip content={<MortalityTooltip />} />
              <Legend />
              <Bar dataKey="survived" name="Survived" fill={COLORS.survived} stackId="a" />
              <Bar dataKey="died" name="Died" fill={COLORS.died} stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>
    </div>
  );
}

