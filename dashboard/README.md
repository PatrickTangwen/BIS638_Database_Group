# MIMIC-IV Pneumonia ICU Dashboard

An interactive medical dashboard for exploring ICU pneumonia patient data from MIMIC-IV. Built with React, TypeScript, Vite, and Tailwind CSS.

![Dashboard Preview](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan)

## 📋 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running Locally](#-running-locally)
- [Building for Production](#-building-for-production)
- [Deployment to GitHub Pages](#-deployment-to-github-pages)
- [Project Structure](#-project-structure)
- [Data Source](#-data-source)

## ✨ Features

- **8 Interactive Dashboard Pages**: Overview, Demographics, Lab Values, Vital Signs, Blood Gas, Outcomes, Length of Stay, and Data Explorer
- **Global Filters**: Filter by age, gender, race, insurance, admission type, outcome, and length of stay
- **Interactive Charts**: Click-to-filter, hover tooltips, responsive visualizations
- **Risk Analysis Tools**: Risk Profile Builder, Disparity Analysis, Lab Threshold Explorer
- **Data Export**: Export filtered data as CSV
- **Responsive Design**: Works on desktop and tablet devices

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
  ```bash
  # Check your Node.js version
  node --version
  ```

- **npm** (v9.0.0 or higher) - comes with Node.js
  ```bash
  # Check your npm version
  npm --version
  ```

### Installing Node.js

If you don't have Node.js installed:

**macOS (using Homebrew):**
```bash
brew install node
```

**Windows:**
Download and install from [nodejs.org](https://nodejs.org/)

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 🚀 Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/YOUR_USERNAME/BIS638_Database_Group.git
   cd BIS638_Database_Group/dashboard
   ```

2. **Navigate to the dashboard directory**:
   ```bash
   cd dashboard
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```
   This will install all required packages including React, Recharts, Tailwind CSS, and other dependencies.

## 💻 Running Locally

### Development Mode (with hot reload)

```bash
npm run dev
```

This will start the development server. Open your browser and navigate to:

```
http://localhost:5173
```

The page will automatically reload when you make changes to the source files.

### Preview Production Build

```bash
npm run build
npm run preview
```

This builds the app for production and serves it locally for preview.

## 🏗️ Building for Production

To create an optimized production build:

```bash
npm run build
```

This will:
- Compile TypeScript
- Bundle and minify JavaScript
- Optimize CSS with Tailwind
- Output files to the `dist/` directory

The `dist/` folder contains all static files ready for deployment.

## 🌐 Deployment to GitHub Pages

### Option 1: Automated Deployment (Recommended)

1. **Create a GitHub repository** (if you haven't already):
   - Go to [github.com/new](https://github.com/new)
   - Create a new repository named `BIS638_Database_Group` (or your preferred name)

2. **Push your code to GitHub**:
   ```bash
   cd /path/to/BIS638_Database_Group
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/BIS638_Database_Group.git
   git push -u origin main
   ```

3. **Create GitHub Actions workflow**:
   
   Create the file `.github/workflows/deploy.yml` in your repository root:
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: ['main']
     workflow_dispatch:

   permissions:
     contents: read
     pages: write
     id-token: write

   concurrency:
     group: 'pages'
     cancel-in-progress: true

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v4

         - name: Setup Node
           uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
             cache-dependency-path: dashboard/package-lock.json

         - name: Install dependencies
           working-directory: ./dashboard
           run: npm ci

         - name: Build
           working-directory: ./dashboard
           run: npm run build

         - name: Setup Pages
           uses: actions/configure-pages@v4

         - name: Upload artifact
           uses: actions/upload-pages-artifact@v3
           with:
             path: './dashboard/dist'

     deploy:
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       runs-on: ubuntu-latest
       needs: build
       steps:
         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v4
   ```

4. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under "Build and deployment", select **GitHub Actions** as the source
   - Click **Save**

5. **Trigger deployment**:
   - Push any change to the `main` branch, or
   - Go to **Actions** tab → **Deploy to GitHub Pages** → **Run workflow**

6. **Access your deployed dashboard**:
   ```
   https://YOUR_USERNAME.github.io/BIS638_Database_Group/
   ```

### Option 2: Manual Deployment

1. **Build the project**:
   ```bash
   cd dashboard
   npm run build
   ```

2. **Deploy using gh-pages package**:
   ```bash
   npm install -D gh-pages
   ```

3. **Add deploy script to package.json**:
   ```json
   {
     "scripts": {
       "deploy": "gh-pages -d dist"
     }
   }
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages**:
   - Go to repository **Settings** → **Pages**
   - Set source to **Deploy from a branch**
   - Select **gh-pages** branch and **/ (root)**
   - Click **Save**

## 📁 Project Structure

```
dashboard/
├── public/                  # Static assets
│   ├── mimic_pneumonia_cohort_full.csv  # Patient data
│   └── column_descriptions.json          # Data dictionary
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── charts/          # Chart components
│   │   ├── filters/         # Filter components
│   │   └── ui/              # General UI components
│   ├── context/             # React context (FilterContext)
│   ├── pages/               # Dashboard pages
│   │   ├── SummaryPage.tsx
│   │   ├── DemographicsPage.tsx
│   │   ├── ClinicalPage.tsx
│   │   ├── VitalsPage.tsx
│   │   ├── RespiratoryPage.tsx
│   │   ├── OutcomesPage.tsx
│   │   ├── LOSPage.tsx
│   │   └── ExplorerPage.tsx
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
```

## 📊 Data Source

This dashboard uses de-identified patient data from **MIMIC-IV** (Medical Information Mart for Intensive Care IV):

- **Source**: Beth Israel Deaconess Medical Center
- **Time Period**: 2008-2019
- **Cohort**: ICU pneumonia patients (~5,298 ICU stays)
- **Database**: [PhysioNet MIMIC-IV](https://physionet.org/content/mimiciv/2.2/)

**Note**: This dashboard is for **educational and research purposes only**. The data has been de-identified in compliance with HIPAA regulations.

## 🛠️ Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
# Then restart
npm run dev
```

**Clear Vite cache:**
```bash
rm -rf node_modules/.vite
npm run dev
```

**Dependency issues:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Build fails:**
```bash
# Check for TypeScript errors
npm run build 2>&1 | head -50
```


---

**Built with ❤️ for BIS638 Database Group Project**

