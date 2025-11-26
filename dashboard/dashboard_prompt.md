# Interactive Medical Dashboard Requirements

## Project Overview
**Purpose:** Build a public, interactive medical dashboard for exploring ICU pneumonia patient data from MIMIC-IV. The dashboard should allow anyone to explore trends, patterns, and clinical insights without authentication.

**Dataset:** `mimic_pneumonia_cohort_full.csv`
- **Total Records:** ~5,298 ICU stays
- **Time Period:** 2008-2019
- **Source:** MIMIC-IV (Beth Israel Deaconess Medical Center)

---

## Core Design Principles

1. **Public Access** - No login or authentication required
2. **Fully Interactive** - Users can filter, drill-down, and explore data freely
3. **Responsive** - Works on desktop and tablet devices
4. **Educational** - Includes tooltips and explanations for medical terms

---

## Interactive Features Required

### 1. Global Filters (Persistent Across All Views)
Allow users to filter the entire dashboard by:

| Filter | Type | Options |
|--------|------|---------|
| **Age Range** | Range Slider | 18-91 years (drag to select range) |
| **Gender** | Multi-select Checkbox | Male, Female |
| **Race/Ethnicity** | Multi-select Dropdown | All race categories |
| **Insurance Type** | Multi-select Dropdown | Medicare, Medicaid, Private, etc. |
| **Admission Type** | Multi-select Dropdown | Emergency, Elective, Urgent, etc. |
| **Outcome** | Toggle/Checkbox | Survived / Died |
| **ICU LOS Range** | Range Slider | 0-30+ days |
| **Hospital LOS Range** | Range Slider | 0-60+ days |
| **Date Range** | Date Picker | Filter by admission date (if extractable from data) |

### 2. Click-to-Filter Interactions
- Click on any chart element (bar, pie slice, data point) to filter entire dashboard
- Click on demographic category to see only that population
- Click on outcome (survived/died) to isolate that cohort

### 3. Hover Tooltips
- Show detailed statistics on hover (count, percentage, mean, median)
- Display medical term definitions for non-clinical users
- Show confidence intervals where applicable

### 4. Drill-Down Capabilities
- From summary → detailed view
- From demographic group → individual patient-level patterns
- From lab category → specific lab tests

### 5. Search & Lookup
- Search box to find specific `subject_id` or `hadm_id`
- Quick lookup for specific patient cohorts

### 6. Data Export
- Allow users to export filtered data as CSV
- Export current view as PNG/PDF

---

## Dashboard Pages & Visualizations

### Page 1: Executive Summary
**Purpose:** High-level overview with key metrics

| Visualization | Type | Interactive Features |
|--------------|------|---------------------|
| **Total Patients** | KPI Card | Click to see patient list |
| **Mortality Rate** | KPI Card with gauge | Hover for confidence interval |
| **Avg ICU LOS** | KPI Card | Click to see distribution |
| **Avg Hospital LOS** | KPI Card | Click to see distribution |
| **Mortality Trend** | Line/Area Chart | Hover for values, zoom/pan if time-based |
| **Outcome Distribution** | Donut Chart | Click segments to filter |
| **Age Distribution** | Histogram | Brush to select age range |
| **Quick Stats Panel** | Summary Table | Sortable columns |

### Page 2: Demographics Explorer
**Purpose:** Explore patient population characteristics

| Visualization | Type | Interactive Features |
|--------------|------|---------------------|
| **Age Distribution** | Interactive Histogram | Drag to select range, shows survival overlay |
| **Gender Breakdown** | Bar Chart | Click to filter, shows mortality rate per group |
| **Race/Ethnicity** | Horizontal Bar Chart | Click to filter, sortable by count or mortality |
| **Insurance Type** | Treemap or Bar | Click to drill down |
| **Marital Status** | Pie/Donut Chart | Click segments to filter |
| **Language** | Bar Chart | Click to filter |
| **Cross-tabulation** | Heatmap | Select X and Y variables to compare |
| **Mortality by Demographics** | Grouped Bar Chart | Compare mortality across groups |

**Special Feature:** Disparity Analysis Tool
- Dropdown to select demographic variable
- Shows mortality rate comparison with statistical significance indicators

### Page 3: Clinical Markers & Lab Values
**Purpose:** Explore laboratory values and their relationship to outcomes

| Visualization | Type | Interactive Features |
|--------------|------|---------------------|
| **Lab Value Selector** | Dropdown | Choose which lab to visualize |
| **Distribution by Outcome** | Box Plot / Violin Plot | Compare survivors vs non-survivors |
| **Lab Value Ranges** | Range Plot | Show min-max ranges by outcome |
| **Correlation Matrix** | Interactive Heatmap | Click cell to see scatter plot |
| **Abnormal Value Rates** | Bar Chart | Define thresholds, show % abnormal |
| **Lab Trends** | Sparklines | Quick visual of lab patterns |

**Lab Categories to Include:**
- **CBC:** WBC, Hemoglobin, Hematocrit, Platelets
- **Chemistry:** Sodium, Potassium, Chloride, Bicarbonate, BUN, Creatinine, Glucose
- **Liver:** ALT, AST, ALP, Bilirubin, Albumin
- **Coagulation:** PT, PTT, INR, D-dimer, Fibrinogen
- **Inflammation:** CRP

**Special Feature:** Lab Value Threshold Explorer
- Slider to set threshold for any lab value
- Shows how many patients fall above/below
- Displays mortality rate for each group

### Page 4: Vital Signs Analysis
**Purpose:** Explore vital sign patterns and their relationship to outcomes

| Visualization | Type | Interactive Features |
|--------------|------|---------------------|
| **Vital Sign Selector** | Dropdown | Heart Rate, SBP, DBP, MAP, Resp Rate, Temp, SpO2 |
| **Distribution Comparison** | Histogram with Overlay | Compare survivors vs died |
| **Min/Max/Mean Comparison** | Grouped Bar | Toggle between min, max, mean |
| **Vital Sign Ranges** | Range Plot | Show patient variability |
| **Correlation with Mortality** | Scatter Plot | Color by outcome |
| **Abnormal Vital Signs** | Stacked Bar | % patients with abnormal values |

**Special Feature:** Vital Sign Range Filter
- Set custom ranges for any vital sign
- See how many patients meet criteria
- View outcomes for selected range

### Page 5: Respiratory & Blood Gas (Pneumonia Focus)
**Purpose:** Deep dive into respiratory function - critical for pneumonia analysis

| Visualization | Type | Interactive Features |
|--------------|------|---------------------|
| **P/F Ratio Distribution** | Histogram | Highlight ARDS thresholds (300, 200, 100) |
| **P/F Ratio vs Mortality** | Box Plot | Compare by outcome |
| **Lactate Levels** | Distribution + Box Plot | Click to filter by range |
| **pH Analysis** | Histogram | Highlight acidosis/alkalosis zones |
| **pO2/pCO2 Scatter** | Scatter Plot | Color by outcome, hover for details |
| **Blood Gas Summary** | Radar/Spider Chart | Compare survivors vs died |
| **ARDS Severity Classification** | Stacked Bar | Mild/Moderate/Severe by P/F ratio |
| **Oxygenation Index Trend** | Line Chart | If multiple measurements available |

**Special Feature:** ARDS Calculator
- Input P/F ratio threshold
- Shows patient count and mortality rate
- Classifies patients into ARDS severity categories

### Page 6: Outcomes & Risk Analysis
**Purpose:** Understand mortality predictors and risk factors

| Visualization | Type | Interactive Features |
|--------------|------|---------------------|
| **Overall Mortality** | Large KPI with Trend | Click for breakdown |
| **Mortality by Category** | Small Multiples | Demographics, clinical features |
| **LOS vs Mortality** | Scatter Plot | Click points to see details |
| **Risk Factor Comparison** | Forest Plot Style | Show odds/relative risk for factors |
| **Survivor vs Non-Survivor Profile** | Parallel Coordinates | Compare multiple variables |
| **Feature Importance** | Horizontal Bar | If ML model is applied |
| **Kaplan-Meier Style Curve** | Survival Curve | If time-to-event data available |

**Special Feature:** Risk Profile Builder
- Select multiple criteria (age, labs, vitals)
- See mortality rate for that specific combination
- Compare to overall population

### Page 7: Length of Stay Analysis
**Purpose:** Operational insights on resource utilization

| Visualization | Type | Interactive Features |
|--------------|------|---------------------|
| **ICU LOS Distribution** | Histogram | Brush to select range |
| **Hospital LOS Distribution** | Histogram | Brush to select range |
| **LOS by Demographics** | Box Plot Grid | Compare across groups |
| **LOS by Outcome** | Violin Plot | Survivors vs Died |
| **LOS Percentiles** | Table | 25th, 50th, 75th, 90th percentiles |
| **Factors Affecting LOS** | Correlation Bar Chart | Show strongest predictors |
| **ICU vs Hospital LOS** | Scatter Plot | Color by outcome |

**Special Feature:** LOS Calculator
- Filter by patient characteristics
- See expected LOS distribution for that group
- Compare to overall average

### Page 8: Data Explorer (Free-form Analysis)
**Purpose:** Power users can create custom visualizations

| Feature | Description |
|---------|-------------|
| **Variable Selector X-axis** | Dropdown of all numeric columns |
| **Variable Selector Y-axis** | Dropdown of all numeric columns |
| **Color By** | Dropdown for categorical variables |
| **Chart Type** | Scatter, Box, Histogram, Bar |
| **Aggregation** | None, Mean, Median, Sum, Count |
| **Group By** | Optional grouping variable |
| **Filter Panel** | Full filter controls |
| **Export** | Download filtered data |

---

## Data Columns Reference

### Identifiers
- `subject_id` - Unique patient ID
- `hadm_id` - Hospital admission ID  
- `stay_id` - ICU stay ID

### Demographics
- `gender` - M/F
- `admission_age` - Age in years (91 = 89+)
- `race` - Race/ethnicity
- `marital_status` - Marital status
- `insurance` - Insurance type
- `language` - Primary language

### Timing & Length of Stay
- `admittime`, `dischtime` - Hospital admission/discharge
- `icu_intime`, `icu_outtime` - ICU admission/discharge
- `los_hospital` - Hospital LOS (days)
- `los_icu` - ICU LOS (days)

### Admission Info
- `admission_type` - Emergency, Elective, Urgent, etc.
- `admission_location` - Source of admission
- `first_hosp_stay` - First hospitalization flag
- `first_icu_stay` - First ICU stay flag

### Outcomes (Primary)
- `hospital_expire_flag` - **Mortality indicator (1=died, 0=survived)**
- `dod` - Date of death
- `deathtime` - Time of in-hospital death

### Vital Signs (min/max/mean)
- `heart_rate_*` - Heart rate (beats/min)
- `sbp_*`, `dbp_*`, `mbp_*` - Blood pressures (mmHg)
- `resp_rate_*` - Respiratory rate (breaths/min)
- `temperature_*` - Temperature (°C)
- `spo2_*` - Oxygen saturation (%)

### Lab Values - CBC (min/max)
- `wbc_*` - White blood cells (K/uL)
- `hemoglobin_*` - Hemoglobin (g/dL)
- `hematocrit_*` - Hematocrit (%)
- `platelets_*` - Platelets (K/uL)
- `abs_neutrophils_*`, `abs_lymphocytes_*` - Differential counts

### Lab Values - Chemistry (min/max)
- `sodium_*`, `potassium_*`, `chloride_*`, `calcium_*` - Electrolytes
- `bicarbonate_*`, `aniongap_*` - Acid-base
- `bun_*`, `creatinine_*` - Renal function
- `glucose_*` - Blood sugar

### Lab Values - Liver (min/max)
- `alt_*`, `ast_*`, `alp_*` - Liver enzymes
- `bilirubin_total_*` - Bilirubin
- `albumin_*` - Albumin

### Lab Values - Coagulation (min/max)
- `pt_*`, `ptt_*`, `inr_*` - Clotting times
- `d_dimer_*`, `fibrinogen_*` - Coagulation markers

### Blood Gas (min/max) - Critical for Pneumonia
- `ph_*` - Blood pH
- `po2_*`, `pco2_*` - Oxygen and CO2 partial pressures
- `lactate_*` - Lactate (tissue perfusion)
- `pao2fio2ratio_*` - **P/F ratio (key oxygenation metric)**
- `baseexcess_*` - Base excess
- `so2_*` - Oxygen saturation from ABG

### Other
- `crp` - C-reactive protein (inflammation)
- `urineoutput` - Urine output (mL)
- `height`, `weight_*` - Anthropometrics

---

## UI/UX Requirements

### Navigation
- Tab-based navigation between dashboard pages
- Breadcrumb showing current filters applied
- "Reset All Filters" button always visible
- Filter summary panel showing active filters

### Responsiveness
- Desktop-first design (1920x1080 primary)
- Tablet-friendly (1024x768 minimum)
- Collapsible filter panels on smaller screens

### Accessibility
- High contrast color options
- Screen reader compatible
- Keyboard navigation support

### Performance
- Lazy loading for heavy visualizations
- Progressive data loading for large datasets
- Caching for common filter combinations

---

## Color Scheme (Functional)

| Purpose | Color | HEX |
|---------|-------|-----|
| **Survived/Positive** | Green | `#27AE60` |
| **Died/Negative/Alert** | Red/Coral | `#E74C3C` |
| **Primary UI** | Blue | `#2C3E50` |
| **Secondary UI** | Teal | `#148F77` |
| **Background** | Light Gray | `#F8F9FA` |
| **Neutral Data** | Blue-Gray | `#3498DB` |
| **Warning** | Amber | `#F39C12` |
| **Text Primary** | Dark Gray | `#2C3E50` |
| **Text Secondary** | Medium Gray | `#7F8C8D` |
| **Grid/Borders** | Light Gray | `#BDC3C7` |

---

## Example User Interactions

### Scenario 1: "Show me elderly patients with severe respiratory failure"
1. Drag age slider to 70-91
2. Set P/F ratio filter < 200
3. View mortality rate, demographics, lab patterns for this cohort
4. Export data for further analysis

### Scenario 2: "Compare outcomes by race"
1. Go to Demographics page
2. Click on Race/Ethnicity chart
3. See mortality comparison across groups
4. Click specific race to filter entire dashboard
5. Explore clinical patterns for that population

### Scenario 3: "Find high-risk patients"
1. Go to Risk Analysis page
2. Use Risk Profile Builder
3. Select: Age > 65, Lactate > 4, P/F < 150
4. See mortality rate for this combination
5. View how many patients match criteria

### Scenario 4: "Explore relationship between WBC and mortality"
1. Go to Clinical Markers page
2. Select WBC from lab dropdown
3. View distribution by outcome (box plot)
4. Use threshold slider to define "elevated WBC"
5. See mortality rate above vs below threshold

### Scenario 5: "Free exploration"
1. Go to Data Explorer page
2. Set X = admission_age, Y = los_icu
3. Color by hospital_expire_flag
4. See scatter plot of age vs LOS colored by outcome
5. Change chart type to box plot grouped by age bins

---

## Technical Considerations

### Suggested Tech Stack Options
- **Power BI** - Interactive dashboards, built-in filtering
- **Tableau Public** - Free, shareable, highly interactive
- **Streamlit + Plotly** - Javascript, highly customizable
- **Dash (Plotly)** - Production-ready Javascript dashboards
- **Observable/D3.js** - Web-native, highly interactive
- **Apache Superset** - Open source BI tool

### Data Preprocessing Needed
1. Handle missing values (show as "N/A" or exclude from calculations)
2. Create age bins for grouping (18-40, 41-60, 61-80, 80+)
3. Create categorical versions of continuous variables for filtering
4. Calculate derived metrics (e.g., ARDS severity from P/F ratio)

### Performance Tips
- Pre-aggregate common metrics
- Index key filter columns
- Use efficient data formats (parquet for large datasets)
- Implement client-side filtering where possible

---

## Success Criteria

The dashboard is successful if users can:
- [ ] Filter data by any demographic or clinical variable
- [ ] See mortality rates update in real-time as filters change
- [ ] Compare any two groups side-by-side
- [ ] Explore relationships between any two variables
- [ ] Identify patterns in survivors vs non-survivors
- [ ] Export filtered data for external analysis
- [ ] Understand medical terms through tooltips
- [ ] Navigate intuitively without training

---

*This dashboard should serve as an educational and exploratory tool for understanding ICU pneumonia patient outcomes using real-world clinical data.*
