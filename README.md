# BIS638 Pneumonia Cohort Pipeline

## Overview
- Builds a pneumonia-specific cohort from MIMIC-IV (v2.2) for the BIS 638 final project.
- Uses a curated mapping between Disease Ontology (DOID) concepts and ICD-10-CM codes to select admissions with pneumonia-related diagnoses.
- Materializes a wide feature table that merges hospital, ICU, demographic, laboratory, vital sign, inflammation, urine, height, and weight measurements for each stay.

## Repository Contents
- `data_fetch.py` – Google Colab-friendly BigQuery script that authenticates the user, runs the cohort SQL, prints sample rows, and exports the results to `mimic_pneumonia_cohort_full.csv`.
- `pneumonia_doid_icd2.csv` – Mapping table that defines the pneumonia terms, DOID identifiers, and ICD-10-CM codes used to filter MIMIC-IV diagnoses.
- `all_columns.txt` – Ordered list of every column returned by the query, useful as a lightweight data dictionary when building downstream analyses.
- `mimic_pneumonia_cohort_full.csv` – Example extract produced by the script. Re-generate this file after rerunning the query to keep results current.

## Prerequisites
1. **Data access** – PhysioNet credentialed access to MIMIC-IV v2.2 and acceptance of the data use agreement.
2. **Google Cloud project** – Billing-enabled project with BigQuery API activated and access to the PhysioNet public datasets.
3. **Python runtime** – Designed for Google Colab with the following key packages preinstalled or installable via `pip`: `google-cloud-bigquery`, `pandas`, and `google-colab`.
4. **Secrets** – Store your project ID in Colab via `userdata.set('project_id', '<YOUR_PROJECT_ID>')` or replace the `project_id` lookup in the script with a literal string.

## Running the Query (Google Colab)
1. Launch a new Colab notebook, upload `data_fetch.py`, and run the first cell to authenticate with your Google account (`auth.authenticate_user()` opens the OAuth flow).
2. Verify or edit the variables near the top of the script:
   - `dataset_id` – BigQuery dataset that contains the pneumonia mapping table.
   - `disease_table` – Name of the table created from `pneumonia_doid_icd2.csv`.
3. Execute the remaining cells. The helper `query_bigquery` prints progress, retrieves the data as a pandas DataFrame, shows the head, and writes `mimic_pneumonia_cohort_full.csv` to the Colab working directory.
4. Download the CSV from Colab (`Files` sidebar → right-click the file → `Download`) or move it to Cloud Storage for sharing.

## Customizing the Cohort
- **Update diagnosis coverage** – Edit `pneumonia_doid_icd2.csv` to add or adjust ICD-10-CM codes; reload the table in BigQuery so joins reflect the changes.
- **Trim the feature set** – Modify the `SELECT` statement in `data_fetch.py` to drop unused columns or to add derived tables (follow the existing `LEFT JOIN` examples to avoid losing rows).
- **Filter patient populations** – Add `WHERE` clauses (e.g., restrict age, admission type, or ICU service) before the final `ORDER BY`.

## Column Reference
- The query surfaces hundreds of clinical attributes. The ordered array in `all_columns.txt` mirrors the DataFrame schema, making it easy to map column positions to their clinical meaning.
- Import the file in Python with:
  ```python
  with open("all_columns.txt") as f:
      columns = ast.literal_eval(f.read())
  ```
  This is useful when selecting subsets, renaming fields, or validating downstream schema expectations.

## Exported Data
- `mimic_pneumonia_cohort_full.csv` is wide and may exceed typical spreadsheet limits. Prefer loading it with pandas, DuckDB, or BigQuery External Tables for analysis.
- Always keep the CSV alongside the commit hash or SQL revision that produced it to ensure reproducibility.

## Troubleshooting
- **Authentication failures** – Rerun `auth.authenticate_user()` and ensure you are logged into the Google account that owns the Cloud project.
- **Permission errors** – Confirm your Google identity has the `roles/bigquery.dataViewer` role on the PhysioNet public project and read access to your custom dataset.
- **Empty result set** – Verify that the ICD codes in `pneumonia_doid_icd2.csv` were ingested into BigQuery and match the formatting (uppercase, periods removed) used in the join condition.

