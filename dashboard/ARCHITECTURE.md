# MIMIC-IV Pneumonia ICU Dashboard - Architecture & Workflow

This document provides structured diagrams and descriptions for LLM-based diagram generation tools.

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Entry Point"
        A[index.html] --> B[main.tsx]
        B --> C[App.tsx]
    end

    subgraph "State Management"
        C --> D[FilterProvider]
        D --> E[FilterContext]
    end

    subgraph "Data Layer"
        F[mimic_pneumonia_cohort_full.csv] --> G[dataLoader.ts]
        H[column_descriptions.json] --> G
        G --> E
    end

    subgraph "UI Layer"
        E --> I[DashboardContent]
        I --> J[Header + Navigation]
        I --> K[FilterPanel]
        I --> L[Page Router]
    end

    subgraph "Pages"
        L --> M[SummaryPage]
        L --> N[DemographicsPage]
        L --> O[ClinicalPage]
        L --> P[VitalsPage]
        L --> Q[RespiratoryPage]
        L --> R[OutcomesPage]
        L --> S[LOSPage]
        L --> T[ExplorerPage]
    end

    subgraph "Shared Components"
        U[ChartContainer]
        V[KPICard]
        W[CustomTooltip]
        X[MultiSelect]
        Y[RangeSlider]
        Z[LoadingSpinner]
    end

    M & N & O & P & Q & R & S & T --> U & V & W
    K --> X & Y
```

---

## 2. Data Flow Diagram

```mermaid
flowchart LR
    subgraph "Data Sources"
        CSV[CSV File<br/>mimic_pneumonia_cohort_full.csv]
        JSON[JSON File<br/>column_descriptions.json]
    end

    subgraph "Data Loading"
        PAPA[PapaParse Library]
        LOADER[loadCSVData<br/>dataLoader.ts]
        DEDUP[Deduplicate by stay_id]
        CLEAN[Clean & Normalize Data]
    end

    subgraph "State Management"
        ALLDATA[allData State<br/>Raw patient records]
        FILTERS[filters State<br/>User filter selections]
        FILTERED[filteredData<br/>useMemo computed]
    end

    subgraph "Visualization"
        PAGES[Page Components]
        CHARTS[Recharts Library]
        UI[UI Components]
    end

    CSV --> PAPA --> LOADER --> DEDUP --> CLEAN --> ALLDATA
    JSON --> LOADER
    
    ALLDATA --> FILTERED
    FILTERS --> FILTERED
    
    FILTERED --> PAGES --> CHARTS --> UI
```

---

## 3. Component Hierarchy

```mermaid
graph TD
    APP[App.tsx] --> FP[FilterProvider]
    FP --> DC[DashboardContent]
    
    DC --> HEADER[Header]
    DC --> NAV[Navigation Tabs]
    DC --> FILTER[FilterPanel]
    DC --> MAIN[Main Content Area]
    DC --> FOOTER[Footer]
    
    FILTER --> MS[MultiSelect]
    FILTER --> RS[RangeSlider]
    FILTER --> SEARCH[Search Input]
    
    MAIN --> ROUTER{Active Tab Router}
    
    ROUTER -->|summary| SP[SummaryPage]
    ROUTER -->|demographics| DP[DemographicsPage]
    ROUTER -->|clinical| CP[ClinicalPage]
    ROUTER -->|vitals| VP[VitalsPage]
    ROUTER -->|respiratory| RP[RespiratoryPage]
    ROUTER -->|outcomes| OP[OutcomesPage]
    ROUTER -->|los| LP[LOSPage]
    ROUTER -->|explorer| EP[ExplorerPage]
    
    SP & DP & CP & VP & RP & OP & LP & EP --> CC[ChartContainer]
    SP & DP & CP & VP & RP & OP & LP & EP --> KPI[KPICard]
    
    CC --> RECHARTS[Recharts Components]
    RECHARTS --> BAR[BarChart]
    RECHARTS --> PIE[PieChart]
    RECHARTS --> LINE[LineChart]
    RECHARTS --> AREA[AreaChart]
    RECHARTS --> SCATTER[ScatterChart]
```

---

## 4. State Management Flow (FilterContext)

```mermaid
stateDiagram-v2
    [*] --> Initial: App Mounts
    
    Initial --> Loading: loadCSVData()
    Loading --> DataLoaded: setAllData(data)
    
    DataLoaded --> Filtering: User Interacts
    Filtering --> FilterApplied: updateFilter()
    FilterApplied --> Recompute: useMemo triggers
    Recompute --> Render: filteredData updates
    Render --> Filtering: User Interacts Again
    
    FilterApplied --> Reset: resetFilters()
    Reset --> Recompute
```

---

## 5. Filter Logic Flow

```mermaid
flowchart TB
    START[allData Array] --> F1{Age Range Filter}
    F1 -->|Pass| F2{Gender Filter}
    F1 -->|Fail| EXCLUDE[Exclude Record]
    
    F2 -->|Pass| F3{Race Filter}
    F2 -->|Fail| EXCLUDE
    
    F3 -->|Pass| F4{Insurance Filter}
    F3 -->|Fail| EXCLUDE
    
    F4 -->|Pass| F5{Admission Type Filter}
    F4 -->|Fail| EXCLUDE
    
    F5 -->|Pass| F6{Outcome Filter}
    F5 -->|Fail| EXCLUDE
    
    F6 -->|Pass| F7{ICU LOS Filter}
    F6 -->|Fail| EXCLUDE
    
    F7 -->|Pass| F8{Hospital LOS Filter}
    F7 -->|Fail| EXCLUDE
    
    F8 -->|Pass| F9{Search ID Filter}
    F8 -->|Fail| EXCLUDE
    
    F9 -->|Pass| INCLUDE[Include in filteredData]
    F9 -->|Fail| EXCLUDE
    
    INCLUDE --> OUTPUT[filteredData Array]
    EXCLUDE --> NEXT[Next Record]
    NEXT --> F1
```

---

## 6. Page Responsibility Matrix

```mermaid
mindmap
    root((Dashboard Pages))
        Summary
            KPI Cards
            Outcome Distribution
            Age Distribution
            Gender Distribution
            Admission Type
            ICU LOS Distribution
            Quick Stats Table
        Demographics
            Age Analysis
            Gender Analysis
            Race/Ethnicity
            Insurance
            Marital Status
        Clinical
            CBC Labs
            Chemistry Panel
            Liver Function
            Coagulation
        Vitals
            Heart Rate
            Blood Pressure
            Temperature
            Respiratory Rate
            SpO2
        Respiratory
            Blood Gas
            pH Levels
            PO2/PCO2
            Lactate
            P/F Ratio
        Outcomes
            Mortality Analysis
            Survival Curves
            Risk Factors
        LOS
            ICU Stay Duration
            Hospital Stay Duration
            Trends & Patterns
        Explorer
            Custom Variable Selection
            Scatter Plots
            Correlation Analysis
```

---

## 7. Technology Stack

```mermaid
graph LR
    subgraph "Build & Dev"
        VITE[Vite]
        TS[TypeScript]
        POSTCSS[PostCSS]
    end

    subgraph "UI Framework"
        REACT[React 18]
        TW[Tailwind CSS]
        LUCIDE[Lucide Icons]
    end

    subgraph "Data & Charts"
        PAPA[PapaParse]
        RECHARTS[Recharts]
    end

    subgraph "State"
        CONTEXT[React Context API]
        HOOKS[useState / useMemo / useCallback]
    end

    VITE --> REACT
    TS --> REACT
    REACT --> TW
    REACT --> LUCIDE
    REACT --> RECHARTS
    PAPA --> CONTEXT
    CONTEXT --> HOOKS
    HOOKS --> RECHARTS
```

---

## 8. File Structure Map

```
dashboard/
├── index.html                 # HTML entry point
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind CSS config
├── tsconfig.json              # TypeScript config
├── package.json               # Dependencies
│
├── public/
│   ├── mimic_pneumonia_cohort_full.csv  # Patient data
│   └── column_descriptions.json          # Metadata
│
└── src/
    ├── main.tsx               # React entry point
    ├── App.tsx                # Root component + routing
    ├── index.css              # Global styles
    │
    ├── types/
    │   └── index.ts           # TypeScript interfaces
    │
    ├── context/
    │   └── FilterContext.tsx  # Global state management
    │
    ├── utils/
    │   └── dataLoader.ts      # Data loading & utilities
    │
    ├── components/
    │   ├── charts/
    │   │   ├── ChartContainer.tsx   # Chart wrapper
    │   │   └── CustomTooltip.tsx    # Chart tooltips
    │   ├── filters/
    │   │   ├── FilterPanel.tsx      # Main filter UI
    │   │   ├── MultiSelect.tsx      # Multi-select dropdown
    │   │   └── RangeSlider.tsx      # Range input
    │   └── ui/
    │       ├── KPICard.tsx          # Metric cards
    │       ├── LoadingSpinner.tsx   # Loading states
    │       └── Tooltip.tsx          # Info tooltips
    │
    └── pages/
        ├── SummaryPage.tsx      # Overview dashboard
        ├── DemographicsPage.tsx # Demographics analysis
        ├── ClinicalPage.tsx     # Lab values
        ├── VitalsPage.tsx       # Vital signs
        ├── RespiratoryPage.tsx  # Blood gas analysis
        ├── OutcomesPage.tsx     # Mortality outcomes
        ├── LOSPage.tsx          # Length of stay
        └── ExplorerPage.tsx     # Custom exploration
```

---

## 9. User Interaction Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant H as Header/Nav
    participant F as FilterPanel
    participant C as FilterContext
    participant P as Page Component
    participant R as Recharts

    Note over U,R: App Initialization
    U->>H: Opens Dashboard
    H->>C: loadCSVData()
    C->>C: Parse & Store allData
    C->>P: Provide filteredData
    P->>R: Render Charts

    Note over U,R: Filter Interaction
    U->>F: Select Gender = "M"
    F->>C: updateFilter('gender', ['M'])
    C->>C: Recompute filteredData
    C->>P: Updated filteredData
    P->>R: Re-render Charts

    Note over U,R: Navigation
    U->>H: Click "Lab Values" Tab
    H->>P: Switch to ClinicalPage
    P->>C: useFilters()
    C->>P: Provide filteredData
    P->>R: Render Lab Charts
```

---

## 10. Data Schema (PatientRecord Interface)

```mermaid
erDiagram
    PatientRecord {
        number subject_id PK
        number hadm_id FK
        number stay_id UK
        string gender
        number admission_age
        string race
        string marital_status
        string insurance
        string admission_type
        number los_hospital
        number los_icu
        number hospital_expire_flag
    }

    VitalSigns {
        number heart_rate_min
        number heart_rate_max
        number heart_rate_mean
        number sbp_min_max_mean
        number dbp_min_max_mean
        number mbp_min_max_mean
        number resp_rate_min_max_mean
        number temperature_min_max_mean
        number spo2_min_max_mean
    }

    LabValues {
        number wbc_min_max
        number hemoglobin_min_max
        number platelets_min_max
        number sodium_min_max
        number potassium_min_max
        number creatinine_min_max
        number glucose_min_max
    }

    BloodGas {
        number ph_min_max
        number po2_min_max
        number pco2_min_max
        number lactate_min_max
        number pao2fio2ratio_min_max
    }

    PatientRecord ||--|| VitalSigns : has
    PatientRecord ||--|| LabValues : has
    PatientRecord ||--|| BloodGas : has
```

---

## 11. Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        DEV[npm run dev]
        VITE_DEV[Vite Dev Server]
        HMR[Hot Module Reload]
    end

    subgraph "Build"
        BUILD[npm run build]
        VITE_BUILD[Vite Build]
        DIST[/dist folder/]
    end

    subgraph "Static Hosting"
        GH[GitHub Pages]
        VERCEL[Vercel]
        NETLIFY[Netlify]
    end

    DEV --> VITE_DEV --> HMR
    BUILD --> VITE_BUILD --> DIST
    DIST --> GH & VERCEL & NETLIFY
```

---

## Quick Reference for LLM Tools

### For Diagram Generation Prompts:

1. **Architecture Diagram**: "Create a system architecture showing React app with FilterContext state, 8 page components, and Recharts visualization layer"

2. **Data Flow**: "Draw data flow from CSV file through PapaParse, to FilterContext state, filtered by user selections, rendered via Recharts"

3. **Component Tree**: "Generate React component hierarchy: App → FilterProvider → DashboardContent → [Header, FilterPanel, Pages] → [Chart/KPI Components]"

4. **State Machine**: "Create state diagram for filter workflow: Initial → Loading → DataLoaded → Filtering ↔ FilterApplied → Render"

### Key Relationships:
- `FilterProvider` wraps entire app (global state)
- `useFilters()` hook accesses context in any component
- `filteredData` is memoized, recomputes on filter changes
- All pages consume same `filteredData` from context
- Recharts components receive data as props from pages

