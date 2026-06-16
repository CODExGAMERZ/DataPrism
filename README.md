# DataPrism

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=CODExGAMERZ.dataprism">
    <img src="https://img.shields.io/badge/Publisher-CODExGAMERZ-blueviolet?style=for-the-badge" alt="Publisher" />
  </a>
  <img src="https://img.shields.io/badge/Version-1.1.0-7c5cfc?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/Environment-100%25%20Offline-success?style=for-the-badge" alt="Offline" />
  <img src="https://img.shields.io/badge/License-MIT-44dd88?style=for-the-badge" alt="License" />
</p>

---

## 👁️ Overview

**DataPrism** is a local-first, zero-configuration Exploratory Data Analysis (EDA) tool packaged as a VS Code extension. It allows developers, analysts, and data scientists to immediately view, profile, and assess the quality of CSV and JSON datasets without leaving the editor. 

By eliminating the need to write custom Python parser scripts, set up environments, or upload data to remote cloud services, DataPrism streamlines the initial step of data auditing with a native, responsive React interface.

---

## 🌐 DataPrism Online (Web Version)

DataPrism is also available as a live web application deployed on Vercel:
👉 **[Launch DataPrism Web App](https://dataprismext.vercel.app/)**

You can also run it locally or deploy it yourself from the [website/](file:///C:/Users/codex/GitHub/DataPrism/website/) directory. It performs all file parsing and mathematical profiling client-side, fully offline inside your browser. No data is ever uploaded to a server!

### Running Locally
To launch the website version on your local machine:
1. Navigate to the website directory:
   ```bash
   cd website
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your web browser.

### Deploying to Vercel
This repository is configured with a root-level `vercel.json` for instant deployment:
1. Import this repository into Vercel.
2. Vercel will auto-detect the configuration, build the frontend from `website/`, and host it.

---

## 🌟 Interactive UI Panels

The extension loads a tabbed panel interface built using VS Code theme-compliant styles:

### 1. 📋 Preview Tab
* Displays the first **100 rows** of the dataset in a grid table.
* Integrates sortable headers for multi-direction sorting.
* Features automatic row-level null-value highlighting (rendered in clear warning tones).

### 2. 📊 Summary Tab
* **Card Metrics Grid**: Displays total rows, columns, file size, memory usage, missing cells ratio, and duplicate row percentage.
* **Descriptive Stats Table**: For numerical columns, shows count, mean, median, standard deviation, skewness, min, max, and quartile boundaries ($Q_{25}$, $Q_{75}$).
* **Categorical Distribution**: Displays category counts, unique value counts, the most frequent value, and its percentage.
* **Temporal Tracking**: Outlines start/end dates, day range, and missing timestamps.

### 3. 💡 Insights Tab
* **Executive Summary**: A dynamic, heuristic-driven natural language summary of the dataset layout, inferred task category, and general health details.
* **Feature Suggestions**: Recommended actions for log transformations on skewed data, feature scaling, dropping index columns, and resolving highly correlated feature pairs.
* **Missing Value Imputations**: Imputation recipes (mean, median, mode, constant) accompanied by copyable Pandas code snippets.
* **Competition Guidelines**: Identifies potential target variables, alerts on target leakage variables, suggests CV validation splits (temporal vs stratified), and details model suggestions.

### 4. 🧮 Correlations Tab
* **Pearson & Spearman Matrices**: Evaluates relationships between numerical fields.
* **Interactive Heatmap**: Custom canvas component that renders a correlation matrix with tooltips and responsive cell highlighting.
* **Performance Safeguards**: Auto-detects matrices exceeding 50 columns and warns the user to prevent performance lag.

### 5. 🛡️ Quality Tab
* **0–100 Data Health Score**: A composite metric computed from the dataset's overall cleanliness.
* **Outlier Profiler**: Displays columns with high outlier counts using the Interquartile Range (IQR) method and previews the top 5 most extreme values with their row indexes.
* **Deduction Audit Log**: Itemized list showing precisely why points were deducted, guiding data cleaning tasks.

### 6. 📐 Columns Tab
* Aggregates statistics, warnings, and distribution charts into dedicated column profile cards.
* Generates actionable suggestions based on statistical anomalies (e.g., log transformation recommendations, cardinality warnings).

---

## 📐 Mathematical Engines

DataPrism processes statistics and quality metrics completely offline using pure TypeScript algorithms:

### Descriptive Statistics
* **Standard Deviation ($\sigma$)**:
  $$\sigma = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (x_i - \mu)^2}$$
  Where $\mu$ is the mean and $N$ is the sample size.
* **Fisher-Pearson Skewness ($g_1$)**:
  $$g_1 = \frac{\frac{1}{N} \sum_{i=1}^{N} (x_i - \mu)^3}{\sigma^3}$$
* **Percentiles ($P$)**: Calculated using linear interpolation between closest ranks to guarantee accuracy for non-integer ranks.

### Outlier Detection (IQR Method)
Computes boundaries to identify extreme entries:
* $\text{IQR} = Q_{75} - Q_{25}$
* $\text{Lower Bound} = Q_{25} - 1.5 \times \text{IQR}$
* $\text{Upper Bound} = Q_{75} + 1.5 \times \text{IQR}$
Any value falling outside $[\text{Lower Bound}, \text{Upper Bound}]$ is flagged as an outlier.

### Data Quality Deduction Matrix
The quality score starts at **100** and receives deductions based on the following penalty schedule:

| Cleanliness Vector | Metric Evaluated | Penalty Applied |
|---|---|---|
| **Completeness** | Percentage of missing/null values across the dataset | **-0.5 points** per 1% missing |
| **Uniqueness** | Percentage of duplicate rows | **-0.1 points** per 1% duplicates |
| **Consistency** | Columns containing mixed types | **-15.0 points** flat per mixed column |
| **Reliability** | Percentage of outliers detected in numerical columns | **-2.0 points** per 1% outliers |
| **Variance** | Columns with zero variance (constant values) | **-10.0 points** flat per constant column |

*Note: The score is bounded at a minimum of 0.*

---

## ⚙️ Parsing Specifications

DataPrism implements robust parsing routines without external binaries:
* **CSV Parsing**:
  * Scans file buffers for Byte Order Marks (BOM) to support `UTF-8` and `UTF-8-BOM` encodings.
  * Falls back to `Latin-1` encoding if invalid characters are detected.
  * Handles standard comma separation, quoted fields, and escaped characters.
* **JSON Parsing**:
  * Parses flat arrays of values or objects.
  * **Nested Flattening**: Automatically flattens nested objects up to 1-level deep using dot-notation keys (e.g. `{"user": {"age": 25}}` is flattened to `{"user.age": 25}`).
  * Stringifies complex arrays and deep objects to represent them in the preview tables.

---

## 🛠️ Developer & Build Guide

If you want to compile, modify, or package the extension from source, follow this guide:

### Directory Structure
```
DataPrism/
├── dist/                     # Compiled extension output (commonjs)
├── media/                    # Extension assets (logo, icons)
├── src/                      # Extension host source code (TypeScript)
│   ├── analysis/             # Core math & parsing algorithms
│   ├── commands/             # Registered editor commands
│   ├── panels/               # Webview controller & html renderer
│   ├── report/               # Self-contained HTML report generator
│   └── types/                # Core TypeScript interfaces
├── webview-ui/               # React Webview frontend
│   ├── dist/                 # Bundled React assets (Vite)
│   └── src/                  # App components, charts, and CSS
├── package.json              # Extension manifest
└── tsconfig.json             # Root TypeScript config
```

### Setup & Run Commands

1. **Clone and Install Root Dependencies**:
   ```bash
   npm install
   ```

2. **Install Webview Frontend Dependencies**:
   ```bash
   cd webview-ui
   npm install
   cd ..
   ```

3. **Build the Entire Project**:
   Compiles the host TypeScript code using Esbuild and builds the React frontend using Vite:
   ```bash
   npm run compile:all
   ```

4. **Watch Mode (Development)**:
   Launches Esbuild in watch mode to compile host changes on the fly:
   ```bash
   npm run watch
   ```

5. **Launch in Debug Mode**:
   Press **`F5`** inside VS Code to open the Extension Development Host window. Open any `.csv` or `.json` file inside the host window to test the visual panel.

6. **Build VSIX Package**:
   To bundle the extension into an installable `.vsix` file:
   ```bash
   npx @vscode/vsce package
   ```

---

## ⚙️ User Settings

Configure these options in your global `settings.json`:

* `dataprism.sampleSizeRows` (default: `100000`): Maximum rows to analyze for large datasets.
* `dataprism.largeFileThresholdMB` (default: `50`): Files larger than this value are automatically sampled.
* `dataprism.correlationMethod` (default: `"pearson"`): Pearson or Spearman method.
* `dataprism.defaultExportFormat` (default: `"html"`): Report format for exports.
* `dataprism.exportPath` (default: `""`): Target folder for exported reports (defaults to the source file directory).

---

## ⌨️ Command Keyboard Shortcuts

* **`Ctrl+Shift+L`** (Windows/Linux) or **`Cmd+Shift+L`** (macOS): Re-runs the profiling engine on the active dataset to capture file updates.
