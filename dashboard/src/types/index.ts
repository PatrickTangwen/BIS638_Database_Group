export interface PatientRecord {
  // Identifiers
  subject_id: number;
  hadm_id: number;
  stay_id: number;
  
  // Demographics
  gender: 'M' | 'F';
  admission_age: number;
  race: string;
  marital_status: string;
  insurance: string;
  language: string;
  
  // Admission Info
  admission_type: string;
  admission_location: string;
  admittime: string;
  dischtime: string;
  
  // ICU Info
  icu_intime: string;
  icu_outtime: string;
  los_hospital: number;
  los_icu: number;
  first_hosp_stay: boolean;
  first_icu_stay: boolean;
  
  // Outcome
  hospital_expire_flag: 0 | 1;
  dod: string | null;
  deathtime: string | null;
  
  // Vital Signs
  heart_rate_min: number | null;
  heart_rate_max: number | null;
  heart_rate_mean: number | null;
  sbp_min: number | null;
  sbp_max: number | null;
  sbp_mean: number | null;
  dbp_min: number | null;
  dbp_max: number | null;
  dbp_mean: number | null;
  mbp_min: number | null;
  mbp_max: number | null;
  mbp_mean: number | null;
  resp_rate_min: number | null;
  resp_rate_max: number | null;
  resp_rate_mean: number | null;
  temperature_min: number | null;
  temperature_max: number | null;
  temperature_mean: number | null;
  spo2_min: number | null;
  spo2_max: number | null;
  spo2_mean: number | null;
  
  // Lab Values - CBC
  wbc_min: number | null;
  wbc_max: number | null;
  hemoglobin_min: number | null;
  hemoglobin_max: number | null;
  hematocrit_min: number | null;
  hematocrit_max: number | null;
  platelets_min: number | null;
  platelets_max: number | null;
  
  // Lab Values - Chemistry
  sodium_min: number | null;
  sodium_max: number | null;
  potassium_min: number | null;
  potassium_max: number | null;
  chloride_min: number | null;
  chloride_max: number | null;
  bicarbonate_min: number | null;
  bicarbonate_max: number | null;
  bun_min: number | null;
  bun_max: number | null;
  creatinine_min: number | null;
  creatinine_max: number | null;
  glucose_min: number | null;
  glucose_max: number | null;
  calcium_min: number | null;
  calcium_max: number | null;
  aniongap_min: number | null;
  aniongap_max: number | null;
  
  // Lab Values - Liver
  alt_min: number | null;
  alt_max: number | null;
  ast_min: number | null;
  ast_max: number | null;
  alp_min: number | null;
  alp_max: number | null;
  bilirubin_total_min: number | null;
  bilirubin_total_max: number | null;
  albumin_min: number | null;
  albumin_max: number | null;
  
  // Lab Values - Coagulation
  pt_min: number | null;
  pt_max: number | null;
  ptt_min: number | null;
  ptt_max: number | null;
  inr_min: number | null;
  inr_max: number | null;
  d_dimer_min: number | null;
  d_dimer_max: number | null;
  fibrinogen_min: number | null;
  fibrinogen_max: number | null;
  
  // Blood Gas
  ph_min: number | null;
  ph_max: number | null;
  po2_min: number | null;
  po2_max: number | null;
  pco2_min: number | null;
  pco2_max: number | null;
  lactate_min: number | null;
  lactate_max: number | null;
  pao2fio2ratio_min: number | null;
  pao2fio2ratio_max: number | null;
  baseexcess_min: number | null;
  baseexcess_max: number | null;
  so2_min: number | null;
  so2_max: number | null;
  
  // Other
  crp: number | null;
  urineoutput: number | null;
  height: number | null;
  weight: number | null;
  weight_admit: number | null;
  
  // Additional fields from CSV
  [key: string]: unknown;
}

export interface FilterState {
  ageRange: [number, number];
  gender: string[];
  race: string[];
  insurance: string[];
  admissionType: string[];
  outcome: ('survived' | 'died')[];
  icuLosRange: [number, number];
  hospitalLosRange: [number, number];
  searchId: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  count?: number;
  percentage?: number;
  survived?: number;
  died?: number;
  mortalityRate?: number;
}

export interface KPIData {
  value: number | string;
  label: string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

export interface ColumnDescription {
  description: string;
  source: string;
  category: string;
  unit?: string;
  data_type?: string;
}

export interface ColumnDescriptions {
  metadata: {
    title: string;
    sources: string[];
    generated_date: string;
  };
  columns: Record<string, ColumnDescription>;
}

export type TabId = 
  | 'summary' 
  | 'demographics' 
  | 'clinical' 
  | 'vitals' 
  | 'respiratory' 
  | 'outcomes' 
  | 'los' 
  | 'explorer';

