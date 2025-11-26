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
  ZAxis,
  Cell,
} from 'recharts';
import { AlertTriangle, TrendingUp, Users, Activity } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { ChartContainer } from '../components/charts/ChartContainer';
import { KPICard } from '../components/ui/KPICard';
import { calculateMortalityByGroup, calculateStats } from '../utils/dataLoader';

const COLORS = {
  survived: '#27AE60',
  died: '#E74C3C',
  primary: '#3498DB',
  secondary: '#8B5CF6',
};

interface RiskCriteria {
  label: string;
  key: string;
  operator: '<' | '>' | '<=' | '>=';
  value: number;
  unit: string;
}

export function OutcomesPage() {
  const { filteredData } = useFilters();
  
  // Risk profile builder state
  const [riskCriteria, setRiskCriteria] = useState<RiskCriteria[]>([
    { label: 'Age', key: 'admission_age', operator: '>', value: 65, unit: 'years' },
    { label: 'Lactate Max', key: 'lactate_max', operator: '>', value: 4, unit: 'mmol/L' },
    { label: 'P/F Ratio', key: 'pao2fio2ratio_min', operator: '<', value: 150, unit: '' },
  ]);

  // Overall mortality KPIs
  const mortalityKPIs = useMemo(() => {
    const total = filteredData.length;
    const died = filteredData.filter((p) => p.hospital_expire_flag === 1).length;
    const survived = total - died;

    // Calculate by first ICU stay
    const firstICU = filteredData.filter((p) => p.first_icu_stay);
    const firstICUDied = firstICU.filter((p) => p.hospital_expire_flag === 1).length;

    return {
      total,
      died,
      survived,
      mortalityRate: total > 0 ? (died / total) * 100 : 0,
      firstICUMortality: firstICU.length > 0 ? (firstICUDied / firstICU.length) * 100 : 0,
      firstICUCount: firstICU.length,
    };
  }, [filteredData]);

  // Mortality by demographics
  const mortalityByAge = useMemo(() => {
    const bins = [
      { label: '18-40', min: 18, max: 40 },
      { label: '41-60', min: 41, max: 60 },
      { label: '61-70', min: 61, max: 70 },
      { label: '71-80', min: 71, max: 80 },
      { label: '80+', min: 80, max: 200 },
    ];

    return bins.map(({ label, min, max }) => {
      const inBin = filteredData.filter((p) => p.admission_age >= min && p.admission_age <= max);
      const died = inBin.filter((p) => p.hospital_expire_flag === 1).length;
      return {
        name: label,
        total: inBin.length,
        died,
        survived: inBin.length - died,
        mortalityRate: inBin.length > 0 ? (died / inBin.length) * 100 : 0,
      };
    });
  }, [filteredData]);

  // Risk factor analysis
  const riskFactors = useMemo(() => {
    const factors = [
      { 
        name: 'Age > 65', 
        check: (p: typeof filteredData[0]) => p.admission_age > 65 
      },
      { 
        name: 'Lactate > 4', 
        check: (p: typeof filteredData[0]) => (p.lactate_max as number) > 4 
      },
      { 
        name: 'P/F Ratio < 200', 
        check: (p: typeof filteredData[0]) => (p.pao2fio2ratio_min as number) < 200 
      },
      { 
        name: 'Creatinine > 2', 
        check: (p: typeof filteredData[0]) => (p.creatinine_max as number) > 2 
      },
      { 
        name: 'WBC > 15', 
        check: (p: typeof filteredData[0]) => (p.wbc_max as number) > 15 
      },
      { 
        name: 'pH < 7.35', 
        check: (p: typeof filteredData[0]) => (p.ph_min as number) < 7.35 
      },
      { 
        name: 'SBP < 90', 
        check: (p: typeof filteredData[0]) => (p.sbp_min as number) < 90 
      },
      { 
        name: 'HR > 120', 
        check: (p: typeof filteredData[0]) => (p.heart_rate_max as number) > 120 
      },
    ];

    return factors.map((factor) => {
      const withFactor = filteredData.filter(factor.check);
      const withoutFactor = filteredData.filter((p) => !factor.check(p));
      
      const withFactorMortality = withFactor.length > 0 
        ? (withFactor.filter((p) => p.hospital_expire_flag === 1).length / withFactor.length) * 100 
        : 0;
      const withoutFactorMortality = withoutFactor.length > 0 
        ? (withoutFactor.filter((p) => p.hospital_expire_flag === 1).length / withoutFactor.length) * 100 
        : 0;
      
      const relativeRisk = withoutFactorMortality > 0 
        ? withFactorMortality / withoutFactorMortality 
        : 1;

      return {
        name: factor.name,
        withFactor: withFactor.length,
        withFactorMortality,
        withoutFactorMortality,
        relativeRisk,
        riskDiff: withFactorMortality - withoutFactorMortality,
      };
    }).sort((a, b) => b.riskDiff - a.riskDiff);
  }, [filteredData]);

  // LOS vs Mortality scatter data
  const losScatterData = useMemo(() => {
    return filteredData
      .filter((p) => p.los_icu !== null && p.admission_age !== null)
      .slice(0, 500)
      .map((p) => ({
        x: p.los_icu,
        y: p.admission_age,
        outcome: p.hospital_expire_flag === 1 ? 'Died' : 'Survived',
        color: p.hospital_expire_flag === 1 ? COLORS.died : COLORS.survived,
      }));
  }, [filteredData]);

  // Risk profile analysis
  const riskProfileAnalysis = useMemo(() => {
    const meetsCriteria = (patient: typeof filteredData[0]) => {
      return riskCriteria.every((criteria) => {
        const value = patient[criteria.key as keyof typeof patient] as number;
        if (value === null || value === undefined || isNaN(value)) return false;
        
        switch (criteria.operator) {
          case '<': return value < criteria.value;
          case '>': return value > criteria.value;
          case '<=': return value <= criteria.value;
          case '>=': return value >= criteria.value;
          default: return false;
        }
      });
    };

    const matching = filteredData.filter(meetsCriteria);
    const notMatching = filteredData.filter((p) => !meetsCriteria(p));

    return {
      matching: {
        count: matching.length,
        died: matching.filter((p) => p.hospital_expire_flag === 1).length,
        survived: matching.filter((p) => p.hospital_expire_flag === 0).length,
        mortality: matching.length > 0 
          ? (matching.filter((p) => p.hospital_expire_flag === 1).length / matching.length) * 100 
          : 0,
      },
      notMatching: {
        count: notMatching.length,
        died: notMatching.filter((p) => p.hospital_expire_flag === 1).length,
        survived: notMatching.filter((p) => p.hospital_expire_flag === 0).length,
        mortality: notMatching.length > 0 
          ? (notMatching.filter((p) => p.hospital_expire_flag === 1).length / notMatching.length) * 100 
          : 0,
      },
      overall: {
        mortality: mortalityKPIs.mortalityRate,
      },
    };
  }, [filteredData, riskCriteria, mortalityKPIs.mortalityRate]);

  const updateCriteriaValue = (index: number, value: number) => {
    setRiskCriteria((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value };
      return updated;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Overall Mortality"
          value={`${mortalityKPIs.mortalityRate.toFixed(1)}%`}
          icon={<AlertTriangle className="w-5 h-5" />}
          subtitle={`${mortalityKPIs.died.toLocaleString()} deaths`}
          variant="negative"
        />
        <KPICard
          title="Total Patients"
          value={mortalityKPIs.total.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
          subtitle="ICU admissions"
          variant="info"
        />
        <KPICard
          title="Survived"
          value={mortalityKPIs.survived.toLocaleString()}
          icon={<TrendingUp className="w-5 h-5" />}
          subtitle={`${((mortalityKPIs.survived / mortalityKPIs.total) * 100).toFixed(1)}% survival`}
          variant="positive"
        />
        <KPICard
          title="First ICU Mortality"
          value={`${mortalityKPIs.firstICUMortality.toFixed(1)}%`}
          icon={<Activity className="w-5 h-5" />}
          subtitle={`${mortalityKPIs.firstICUCount.toLocaleString()} first stays`}
          tooltip="Mortality rate for first ICU admissions only"
        />
      </div>

      {/* Mortality by Age */}
      <ChartContainer
        title="Mortality Rate by Age Group"
        subtitle="Showing both total counts and mortality rates"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mortalityByAge}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} />
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
                      <div className="font-medium border-b border-primary-600 pb-1 mb-1">
                        Age: {data.name}
                      </div>
                      <div>Total: {data.total.toLocaleString()}</div>
                      <div className="text-survived-light">Survived: {data.survived.toLocaleString()}</div>
                      <div className="text-died-light">Died: {data.died.toLocaleString()}</div>
                      <div className="font-medium mt-1 text-died-light">
                        Mortality: {data.mortalityRate.toFixed(1)}%
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="survived" name="Survived" fill={COLORS.survived} stackId="a" />
              <Bar yAxisId="left" dataKey="died" name="Died" fill={COLORS.died} stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Risk Factor Analysis */}
      <ChartContainer
        title="Risk Factor Analysis"
        subtitle="Comparing mortality rates with and without each risk factor"
        tooltip="Risk factors sorted by mortality rate difference"
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskFactors} layout="vertical">
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
                width={100}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-primary-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                      <div className="font-medium border-b border-primary-600 pb-1 mb-1">{data.name}</div>
                      <div>Patients with factor: {data.withFactor.toLocaleString()}</div>
                      <div className="text-died-light">Mortality with: {data.withFactorMortality.toFixed(1)}%</div>
                      <div className="text-survived-light">Mortality without: {data.withoutFactorMortality.toFixed(1)}%</div>
                      <div className="font-medium mt-1">
                        Relative Risk: {data.relativeRisk.toFixed(2)}x
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar dataKey="withFactorMortality" name="With Risk Factor" fill={COLORS.died} />
              <Bar dataKey="withoutFactorMortality" name="Without Risk Factor" fill={COLORS.survived} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* LOS vs Age Scatter */}
      <ChartContainer
        title="ICU Length of Stay vs Age"
        subtitle="Colored by outcome (sample of 500 patients)"
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="ICU LOS" 
                tick={{ fill: '#64748B', fontSize: 12 }}
                label={{ value: 'ICU LOS (days)', position: 'bottom', fill: '#64748B' }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Age" 
                tick={{ fill: '#64748B', fontSize: 12 }}
                label={{ value: 'Age (years)', angle: -90, position: 'insideLeft', fill: '#64748B' }}
              />
              <ZAxis range={[30, 30]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-primary-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                      <div>ICU LOS: {data.x?.toFixed(1)} days</div>
                      <div>Age: {data.y} years</div>
                      <div style={{ color: data.color }}>{data.outcome}</div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Scatter
                name="Survived"
                data={losScatterData.filter((d) => d.outcome === 'Survived')}
                fill={COLORS.survived}
                opacity={0.6}
              />
              <Scatter
                name="Died"
                data={losScatterData.filter((d) => d.outcome === 'Died')}
                fill={COLORS.died}
                opacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Risk Profile Builder */}
      <ChartContainer
        title="Risk Profile Builder"
        subtitle="Customize criteria to identify high-risk patient groups"
      >
        <div className="space-y-6">
          {/* Criteria Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {riskCriteria.map((criteria, index) => (
              <div key={criteria.key} className="bg-primary-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  {criteria.label} {criteria.operator} {criteria.unit}
                </label>
                <input
                  type="number"
                  value={criteria.value}
                  onChange={(e) => updateCriteriaValue(index, parseFloat(e.target.value))}
                  className="input-base"
                />
              </div>
            ))}
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-died/10 rounded-lg p-4 border-l-4 border-died">
              <div className="text-lg font-semibold text-primary-700">Matching Criteria</div>
              <div className="mt-2 space-y-1 text-sm">
                <div>Patients: {riskProfileAnalysis.matching.count.toLocaleString()}</div>
                <div className="text-survived">Survived: {riskProfileAnalysis.matching.survived.toLocaleString()}</div>
                <div className="text-died">Died: {riskProfileAnalysis.matching.died.toLocaleString()}</div>
                <div className="text-2xl font-bold text-died mt-2">
                  {riskProfileAnalysis.matching.mortality.toFixed(1)}% mortality
                </div>
              </div>
            </div>
            <div className="bg-survived/10 rounded-lg p-4 border-l-4 border-survived">
              <div className="text-lg font-semibold text-primary-700">Not Matching</div>
              <div className="mt-2 space-y-1 text-sm">
                <div>Patients: {riskProfileAnalysis.notMatching.count.toLocaleString()}</div>
                <div className="text-survived">Survived: {riskProfileAnalysis.notMatching.survived.toLocaleString()}</div>
                <div className="text-died">Died: {riskProfileAnalysis.notMatching.died.toLocaleString()}</div>
                <div className="text-2xl font-bold text-survived mt-2">
                  {riskProfileAnalysis.notMatching.mortality.toFixed(1)}% mortality
                </div>
              </div>
            </div>
            <div className="bg-primary-100 rounded-lg p-4 border-l-4 border-medical-blue">
              <div className="text-lg font-semibold text-primary-700">Overall Cohort</div>
              <div className="mt-2 space-y-1 text-sm">
                <div>Total patients: {filteredData.length.toLocaleString()}</div>
                <div className="text-2xl font-bold text-primary-800 mt-2">
                  {riskProfileAnalysis.overall.mortality.toFixed(1)}% mortality
                </div>
                <div className="text-primary-500 mt-2">
                  {riskProfileAnalysis.matching.mortality > riskProfileAnalysis.overall.mortality
                    ? `${(riskProfileAnalysis.matching.mortality / riskProfileAnalysis.overall.mortality).toFixed(1)}x higher risk for matching criteria`
                    : 'Lower risk than overall'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ChartContainer>
    </div>
  );
}

