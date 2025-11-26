# Project Reference Document

> **Purpose**: This document provides comprehensive context for LLMs and AI agents working on this codebase. It describes the project structure, file contents, data schema, and code conventions.

---

## 📋 Project Overview

**Project Name**: MIMIC-IV Pneumonia ICU Dashboard  
**Type**: Interactive Medical Data Visualization Dashboard  
**Tech Stack**: React 18, TypeScript 5, Vite 5, Tailwind CSS 3, Recharts  
**Data Source**: MIMIC-IV (Medical Information Mart for Intensive Care IV)  
**Cohort**: ICU pneumonia patients (~5,298 records, 2008-2019)

### Purpose
A public, interactive dashboard for exploring ICU pneumonia patient data. Users can filter, visualize, and analyze clinical outcomes, demographics, lab values, vital signs, and more.

---

## 📁 Directory Structure

```
BIS638_Database_Group/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions for deployment
├── dashboard/                       # Main React application
│   ├── public/                      # Static assets (served as-is)
│   │   ├── mimic_pneumonia_cohort_full.csv   # Patient data (~5,298 rows)
│   │   ├── column_descriptions.json          # Data dictionary
│   │   └── vite.svg
│   ├── src/                         # Source code
│   │   ├── components/              # Reusable UI components
│   │   │   ├── charts/              # Chart-related components
│   │   │   │   ├── ChartContainer.tsx        # Wrapper for all charts
│   │   │   │   └── CustomTooltip.tsx         # Tooltip components for Recharts
│   │   │   ├── filters/             # Filter components
│   │   │   │   ├── FilterPanel.tsx           # Main filter panel
│   │   │   │   ├── MultiSelect.tsx           # Multi-select dropdown
│   │   │   │   └── RangeSlider.tsx           # Range slider for numeric filters
│   │   │   └── ui/                  # General UI components
│   │   │       ├── KPICard.tsx               # Key Performance Indicator cards
│   │   │       ├── LoadingSpinner.tsx        # Loading state component
│   │   │       └── Tooltip.tsx               # Generic tooltip
│   │   ├── context/                 # React Context providers
│   │   │   └── FilterContext.tsx             # Global filter state management
│   │   ├── pages/                   # Dashboard page components
│   │   │   ├── SummaryPage.tsx               # Executive Summary / Overview
│   │   │   ├── DemographicsPage.tsx          # Demographics Explorer
│   │   │   ├── ClinicalPage.tsx              # Clinical Markers & Lab Values
│   │   │   ├── VitalsPage.tsx                # Vital Signs Analysis
│   │   │   ├── RespiratoryPage.tsx           # Respiratory & Blood Gas
│   │   │   ├── OutcomesPage.tsx              # Outcomes & Risk Analysis
│   │   │   ├── LOSPage.tsx                   # Length of Stay Analysis
│   │   │   └── ExplorerPage.tsx              # Free-form Data Explorer
│   │   ├── types/                   # TypeScript type definitions
│   │   │   └── index.ts                      # All interfaces and types
│   │   ├── utils/                   # Utility functions
│   │   │   └── dataLoader.ts                 # Data loading and processing
│   │   ├── App.tsx                  # Main application component
│   │   ├── main.tsx                 # Application entry point
│   │   └── index.css                # Global styles and Tailwind layers
│   ├── index.html                   # HTML template
│   ├── package.json                 # Dependencies and scripts
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── tsconfig.json                # TypeScript configuration
│   ├── vite.config.ts               # Vite build configuration
│   ├── postcss.config.js            # PostCSS configuration
│   └── README.md                    # Dashboard-specific documentation
├── mimic_pneumonia_cohort_full.csv  # Original data file (copy in public/)
├── column_descriptions.json         # Data dictionary (copy in public/)
├── column_descriptions.csv          # CSV version of data dictionary
├── data_fetch.py                    # Python script for data extraction
├── pneumonia_doid_icd2.csv          # ICD code mappings
├── all_columns.txt                  # List of all data columns
├── README.md                        # Project root README
└── PROJECT_REFERENCE.md             # This file
```

---

## 🗃️ Data Schema

### Primary Data File: `mimic_pneumonia_cohort_full.csv`

**Total Records**: ~5,298 ICU stays  
**Time Period**: 2008-2019  
**Source**: Beth Israel Deaconess Medical Center (MIMIC-IV)

### Column Categories

#### Identifiers
| Column | Type | Description |
|--------|------|-------------|
| `subject_id` | Integer | Unique patient identifier |
| `hadm_id` | Integer | Hospital admission ID |
| `stay_id` | Integer | ICU stay ID |

#### Demographics
| Column | Type | Values/Range | Description |
|--------|------|--------------|-------------|
| `gender` | String | 'M', 'F' | Patient gender |
| `admission_age` | Integer | 18-91 | Age at admission (91 = 89+, de-identified) |
| `race` | String | Various | Race/ethnicity |
| `marital_status` | String | Various | Marital status |
| `insurance` | String | Medicare, Medicaid, Other | Insurance type |
| `language` | String | Various | Primary language |

#### Timing & Length of Stay
| Column | Type | Description |
|--------|------|-------------|
| `admittime` | Datetime | Hospital admission time |
| `dischtime` | Datetime | Hospital discharge time |
| `icu_intime` | Datetime | ICU admission time |
| `icu_outtime` | Datetime | ICU discharge time |
| `los_hospital` | Float | Hospital length of stay (days) |
| `los_icu` | Float | ICU length of stay (days) |

#### Admission Info
| Column | Type | Description |
|--------|------|-------------|
| `admission_type` | String | Emergency, Elective, Urgent, etc. |
| `admission_location` | String | Source of admission |
| `first_hosp_stay` | Boolean | First hospitalization flag |
| `first_icu_stay` | Boolean | First ICU stay flag |

#### Outcomes (Primary Target)
| Column | Type | Values | Description |
|--------|------|--------|-------------|
| `hospital_expire_flag` | Integer | 0, 1 | **Primary outcome**: 1=died, 0=survived |
| `dod` | Date | Date or null | Date of death |
| `deathtime` | Datetime | Datetime or null | Time of in-hospital death |

#### Vital Signs (min/max/mean variants)
| Base Column | Unit | Normal Range |
|-------------|------|--------------|
| `heart_rate_*` | bpm | 60-100 |
| `sbp_*` (systolic BP) | mmHg | 90-120 |
| `dbp_*` (diastolic BP) | mmHg | 60-80 |
| `mbp_*` (mean BP) | mmHg | 70-100 |
| `resp_rate_*` | /min | 12-20 |
| `temperature_*` | °C | 36.5-37.5 |
| `spo2_*` | % | 95-100 |

#### Lab Values - CBC (min/max variants)
| Base Column | Unit | Normal Range |
|-------------|------|--------------|
| `wbc_*` | K/uL | 4.5-11 |
| `hemoglobin_*` | g/dL | 12-17 |
| `hematocrit_*` | % | 36-50 |
| `platelets_*` | K/uL | 150-400 |

#### Lab Values - Chemistry (min/max variants)
| Base Column | Unit | Normal Range |
|-------------|------|--------------|
| `sodium_*` | mEq/L | 136-145 |
| `potassium_*` | mEq/L | 3.5-5.0 |
| `chloride_*` | mEq/L | 98-106 |
| `bicarbonate_*` | mEq/L | 22-29 |
| `bun_*` | mg/dL | 7-20 |
| `creatinine_*` | mg/dL | 0.7-1.3 |
| `glucose_*` | mg/dL | 70-100 |

#### Lab Values - Liver (min/max variants)
| Base Column | Unit | Normal Range |
|-------------|------|--------------|
| `alt_*` | U/L | 7-56 |
| `ast_*` | U/L | 10-40 |
| `alp_*` | U/L | 44-147 |
| `bilirubin_total_*` | mg/dL | 0.1-1.2 |
| `albumin_*` | g/dL | 3.5-5.0 |

#### Blood Gas - Critical for Pneumonia (min/max variants)
| Base Column | Unit | Normal Range | Clinical Significance |
|-------------|------|--------------|----------------------|
| `ph_*` | - | 7.35-7.45 | Acidosis < 7.35 |
| `po2_*` | mmHg | 80-100 | Oxygenation |
| `pco2_*` | mmHg | 35-45 | Ventilation |
| `lactate_*` | mmol/L | 0.5-2.0 | Tissue perfusion |
| `pao2fio2ratio_*` | - | >300 | **P/F ratio**: ARDS severity |
| `baseexcess_*` | mEq/L | -2 to +2 | Metabolic status |

### ARDS Severity (by P/F Ratio)
| Severity | P/F Ratio |
|----------|-----------|
| Normal | > 300 |
| Mild ARDS | 200-300 |
| Moderate ARDS | 100-200 |
| Severe ARDS | < 100 |

---

## 🏗️ Architecture & Key Components

### State Management

**FilterContext** (`src/context/FilterContext.tsx`)
- Global state for all filters
- Provides `filteredData` to all components
- Actions: `updateFilter`, `resetFilters`, `setSearchQuery`

```typescript
interface FilterState {
  ageRange: [number, number];
  gender: string[];
  race: string[];
  insurance: string[];
  admissionType: string[];
  outcome: string[];
  icuLosRange: [number, number];
  hospitalLosRange: [number, number];
  searchQuery: string;
}
```

### Data Flow

```
CSV File (public/)
    ↓
dataLoader.ts (loadCSVData)
    ↓
FilterContext (rawData)
    ↓
FilterContext (filteredData) ←── Filters applied
    ↓
Page Components (consume filteredData)
    ↓
Charts (Recharts)
```

### Page Components

| Page | File | Purpose |
|------|------|---------|
| Overview | `SummaryPage.tsx` | KPIs, outcome distribution, quick stats |
| Demographics | `DemographicsPage.tsx` | Age, gender, race, insurance analysis |
| Lab Values | `ClinicalPage.tsx` | CBC, chemistry, liver, coagulation labs |
| Vital Signs | `VitalsPage.tsx` | Heart rate, BP, respiratory, temperature |
| Blood Gas | `RespiratoryPage.tsx` | P/F ratio, lactate, pH, ARDS classification |
| Outcomes | `OutcomesPage.tsx` | Risk factors, mortality analysis |
| LOS | `LOSPage.tsx` | Length of stay analysis |
| Explorer | `ExplorerPage.tsx` | Free-form data exploration |

### Reusable Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `KPICard` | Display key metrics | title, value, subtitle, icon, trend |
| `ChartContainer` | Wrapper for charts | title, subtitle, actions, children |
| `MultiSelect` | Dropdown with checkboxes | options, selected, onChange, label |
| `RangeSlider` | Numeric range filter | min, max, value, onChange, label |
| `CustomTooltip` | Chart hover tooltips | active, payload, label |

---

## 🎨 Styling System

### Tailwind Configuration (`tailwind.config.js`)

```javascript
// Custom Colors
colors: {
  'medical-blue': '#3B82F6',
  'survived': '#27AE60',      // Green for positive outcomes
  'survived-dark': '#1E8449',
  'died': '#E74C3C',          // Red for negative outcomes
  'died-dark': '#C0392B',
  'warning': '#F39C12',
  'primary': {
    50-900: slate color scale
  },
  'surface': {
    DEFAULT: '#FFFFFF',
    muted: '#F8FAFC'
  }
}
```

### CSS Classes (`src/index.css`)

| Class | Purpose |
|-------|---------|
| `.card` | Standard card container |
| `.kpi-card` | KPI display card |
| `.btn-primary` | Primary action button |
| `.btn-secondary` | Secondary action button |
| `.input-base` | Base input styling |
| `.select-base` | Select dropdown styling |
| `.tab-active` / `.tab-inactive` | Navigation tab states |
| `.badge-survived` / `.badge-died` | Outcome badges |

---

## 📊 Chart Patterns

### Using Recharts

All charts use the Recharts library. Common pattern:

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

<ChartContainer title="Chart Title" subtitle="Description">
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip content={<CustomTooltip />} />
      <Bar dataKey="value" fill="#3B82F6" />
    </BarChart>
  </ResponsiveContainer>
</ChartContainer>
```

### Chart Types Used
- `BarChart` - Categorical comparisons
- `PieChart` / `Pie` - Distribution (donut charts)
- `AreaChart` - Distribution curves
- `ScatterChart` - Correlation analysis
- `LineChart` - Trends (if applicable)

### Color Conventions for Charts
```typescript
const COLORS = {
  survived: '#27AE60',    // Green
  died: '#E74C3C',        // Red
  primary: '#3B82F6',     // Blue
  chart: ['#3498DB', '#27AE60', '#8B5CF6', '#F39C12', '#E74C3C', '#148F77']
};
```

---

## 🔧 Utility Functions

### `dataLoader.ts`

| Function | Purpose | Returns |
|----------|---------|---------|
| `loadCSVData()` | Load and parse CSV | `Promise<PatientData[]>` |
| `calculateStats(values)` | Compute statistics | `{ mean, median, min, max, std }` |
| `createAgeBins(data)` | Group by age ranges | Age bin distribution |
| `calculateMortalityByGroup(data, field)` | Group mortality rates | Grouped data with mortality |
| `getUniqueValues(data, field)` | Get distinct values | `string[]` |

---

## 📝 TypeScript Types

### Key Interfaces (`src/types/index.ts`)

```typescript
interface PatientData {
  subject_id: number;
  hadm_id: number;
  stay_id: number;
  gender: string;
  admission_age: number;
  race: string;
  hospital_expire_flag: number;  // 0 or 1
  los_icu: number;
  los_hospital: number;
  // ... all other columns
}

interface FilterState {
  ageRange: [number, number];
  gender: string[];
  race: string[];
  insurance: string[];
  admissionType: string[];
  outcome: string[];
  icuLosRange: [number, number];
  hospitalLosRange: [number, number];
  searchQuery: string;
}

interface KPI {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType;
  trend?: 'up' | 'down' | 'neutral';
}
```

---

## 🚀 Build & Deploy

### Scripts

```bash
npm run dev      # Development server (localhost:5173)
npm run build    # Production build (outputs to dist/)
npm run preview  # Preview production build
npm run deploy   # Deploy to GitHub Pages
```

### GitHub Pages Deployment

The project uses GitHub Actions (`.github/workflows/deploy.yml`) for automated deployment:
1. Triggered on push to `main` branch
2. Builds the React app
3. Deploys to GitHub Pages

### Base Path Configuration

For GitHub Pages, the base path is set in `vite.config.ts`:
```typescript
base: process.env.NODE_ENV === 'production' ? '/BIS638_Database_Group/' : '/'
```

---

## ⚠️ Important Notes for AI Agents

### Do NOT
- Remove existing comments in code
- Change import formatting
- Add unnecessary abstractions
- Over-engineer solutions
- Use `Hospital` from lucide-react (use `Building2` instead)
- Use `Treemap` from recharts (known rendering issues)

### Code Conventions
- Use functional components with TypeScript
- Use `function` keyword for pure functions
- Use descriptive variable names (e.g., `isLoading`, `hasError`)
- Use Tailwind CSS for styling
- Export named components (not default exports)
- File naming: lowercase with dashes (e.g., `filter-panel.tsx`)

### When Editing
1. Always read the file first before making changes
2. Preserve existing code structure
3. Use the existing color scheme and component patterns
4. Test changes by checking console for errors
5. Ensure filters continue to work after changes

### Common Gotchas
- `hospital_expire_flag`: 0 = survived, 1 = died
- `admission_age` of 91 represents 89+ (de-identified)
- Some lab values may be null - handle with optional chaining
- Charts need `ResponsiveContainer` wrapper for proper sizing

---

## 📚 External Resources

- [MIMIC-IV Documentation](https://physionet.org/content/mimiciv/2.2/)
- [Recharts Documentation](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite Documentation](https://vitejs.dev/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

---

*Last updated: November 2024*

