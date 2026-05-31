# DataLens — Dataset Explorer for VS Code

## Overview

**DataLens** is a VS Code extension that helps data analysts, data scientists, and ML engineers quickly inspect, validate, and understand structured datasets directly inside the editor. It focuses on fast exploratory data analysis (EDA), data quality checks, and practical visual insights without requiring the user to leave VS Code.

The extension is designed as a productivity tool for anyone working with CSV, JSON, Excel, or Parquet files. Instead of manually opening files in spreadsheets, notebooks, or separate BI tools, users can view a dataset summary, detect quality issues, and generate key visualizations from within their development environment.

---

## Problem Statement

Working with datasets usually involves switching between multiple tools:

- A code editor for scripts
- A notebook for analysis
- A spreadsheet app for inspection
- A separate dashboard or notebook for charts

This fragmented workflow slows down analysis and makes early-stage dataset review less efficient. Common pain points include:

- Not knowing dataset shape, types, or missing values at a glance
- Repeatedly writing the same profiling code for each new file
- Difficulty spotting outliers, duplicates, and schema issues early
- Having to leave the editor just to perform basic EDA

DataLens solves this by bringing dataset inspection into VS Code in a simple, structured, and visual way.

---

## Target Users

DataLens is intended for:

- Data analysts
- Data science students
- Machine learning engineers
- Analytics engineers
- Research assistants
- Developers working with data files

---

## Core Value Proposition

DataLens reduces the time needed to understand a dataset by automatically surfacing the most important information:

- What the dataset contains
- Whether the data is clean enough to use
- Which columns need attention
- How variables are distributed
- Where the biggest quality risks are

In one view, the user can move from raw data to actionable insights.

---

## Key Features

### 1. Multi-Format Dataset Support

DataLens should support common structured file types:

- CSV
- JSON
- Excel (`.xlsx`)
- Parquet

Each supported format should be parsed into a normalized tabular representation so the same analysis engine can work across file types.

**Nested JSON handling:** When a JSON file contains nested objects or arrays, DataLens will attempt one level of automatic flattening (e.g., `{ "user": { "id": 1 } }` becomes `user.id`). Deeper nesting beyond one level will be preserved as a serialized string column. The panel will display a notice when flattening has occurred, along with the original key depth.

### 2. Raw Data Preview

Before any analysis, DataLens should show the first 100 rows of the dataset in a scrollable table view. This allows users to verify that parsing was correct and that statistics make sense against real data.

The preview table should:

- Display column names and inferred data types as headers
- Highlight null values visually
- Support basic column sorting (ascending/descending)
- Be the default tab when a file is first opened

### 3. Dataset Summary

When a file is opened, DataLens should display an instant summary such as:

- Number of rows
- Number of columns
- Column names
- Data types
- File size
- Memory usage
- Duplicate rows
- Overall missing value percentage

Example summary:

```text
Rows: 50,000
Columns: 23
Missing Values: 2.1%
Duplicates: 34
Memory Usage: 8.2 MB
```

### 4. Automatic Statistics

DataLens should calculate descriptive statistics based on column type.

For numeric columns:

- Count
- Mean
- Median
- Standard deviation
- Min
- Max
- Quartiles

For categorical columns:

- Unique value count
- Most frequent value
- Frequency percentage
- Distribution summary

For datetime columns:

- Minimum date
- Maximum date
- Range
- Missing count

### 5. Missing Value Detection

The extension should identify missing values at both dataset and column level.

Expected outputs:

- Missing values per column
- Missing value percentage per column
- Columns sorted by severity
- Bar chart for visual review

This helps users immediately identify incomplete or unreliable fields.

### 6. Duplicate Detection

DataLens should detect duplicate rows and optionally highlight duplicate-heavy columns or records.

Useful outputs:

- Total duplicate rows
- Duplicate percentage
- Option to export duplicate row indices
- Option to remove duplicates in a preview workflow

### 7. Correlation Analysis

For numeric columns, DataLens should compute pairwise Pearson correlations and visualize them as a heatmap in the main panel.

This feature helps users quickly identify:

- Strong linear relationships
- Redundant features
- Potential multicollinearity
- Variables worth investigating further

The heatmap should use a diverging color scale (e.g., red for negative, blue for positive) and display coefficient values inside each cell for datasets with 15 or fewer numeric columns. For larger datasets, values are shown on hover only.

### 8. Outlier Detection

DataLens should support basic outlier analysis using simple and explainable methods such as:

- Interquartile Range (IQR)
- Z-score thresholding

Outlier summary should include:

- Number of outliers per numeric column
- Outlier percentage
- Extreme values found
- Suggested review priority

### 9. Data Quality Score

The extension should calculate a clear, easy-to-understand data quality score.

**Scoring model (penalties out of 100):**

| Factor | Max Penalty | Penalty Logic |
|---|---|---|
| Missing values | 25 pts | 0–5% missing → 0 pts; 5–20% → linear scale up to 15 pts; >20% → 25 pts |
| Duplicate rows | 20 pts | 0–1% → 0 pts; 1–5% → linear up to 10 pts; >5% → 20 pts |
| Outliers | 20 pts | <1% outlier rate → 0 pts; 1–5% → linear up to 10 pts; >5% → 20 pts |
| Invalid types | 15 pts | Per column with mixed or unparseable types; capped at 15 pts total |
| Category inconsistency | 20 pts | Detects case variants, leading/trailing whitespace; capped at 20 pts |

**Final score:**

```text
100 - sum(penalties) = quality score
```

Penalties are independent and capped: a dataset cannot score below 0. The scoring breakdown is shown alongside the score so users understand how it was derived.

Example output:

```text
Data Quality Score: 87/100
Deductions: Missing values in 3 columns (−8), 1.2% duplicates (−3), 12 outliers in salary (−2)
```

### 10. Column Insights

Each column should have its own insight card or panel, showing:

- Type
- Unique values
- Null percentage
- Distribution shape
- Dominant values
- Statistical summary
- Suggested next action (e.g., "High skew — consider log transform" for salary columns)

### 11. Visual EDA Cards

The main panel should include the following visual cards, each collapsible:

- Missing values bar chart
- Correlation heatmap (see Feature 7 for rendering rules)
- Distribution plots per numeric column
- Top categories for categorical columns
- Outlier highlights per column
- Data quality score with breakdown

These visuals are designed for quick scanning rather than deep model training.

### 12. Exportable EDA Report

DataLens should be able to export a structured HTML or Markdown report containing:

- Dataset overview
- Raw preview (first 20 rows)
- Missing value analysis
- Statistical summary
- Correlation matrix
- Outlier findings
- Quality score with breakdown
- Notes and recommendations

This is especially useful for sharing analysis with teammates, clients, or instructors.

---

## Optional Advanced Features

### AI-Powered Dataset Explanation

An optional AI assistant can summarize the dataset in plain language, such as:

- What the dataset likely represents
- Which columns appear most important
- Which machine learning tasks may fit the data
- Which fields need attention before modeling

This feature is opt-in and clearly labeled. When used, it sends column names, sample values, and summary statistics to an external API. Users are notified before any data leaves their machine.

### Feature Engineering Suggestions

The extension can recommend potential feature ideas such as:

- Binning age into groups
- Creating ratios
- Encoding categorical variables
- Combining related fields

### Dataset Comparison

Users may compare two datasets to detect:

- Schema differences
- Missing columns
- Type mismatches
- Distribution drift

### Profiling Presets

The extension may offer quick presets such as:

- Fast scan
- Full profiling
- Large dataset mode
- ML readiness scan

---

## Activation Flow

DataLens can be triggered via three entry points:

1. **Right-click context menu** on a supported file in the VS Code Explorer → *"Open with DataLens"* — this is the primary activation path.
2. **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`) → `DataLens: Open File` — opens a file picker filtered to supported extensions.
3. **Editor title bar button** — when a supported file is already open in the editor, a DataLens icon appears in the editor toolbar for one-click analysis.

DataLens does **not** activate automatically when a file is opened to avoid interfering with users who just want to view raw file content.

---

## Keyboard Shortcuts and Commands

The following commands should be registered in `contributes.commands` and accessible via the Command Palette:

| Command | Default Shortcut | Description |
|---|---|---|
| `DataLens: Open File` | — | Open a dataset file for analysis |
| `DataLens: Re-analyze` | `Ctrl+Shift+L` / `Cmd+Shift+L` | Re-run analysis on the current file |
| `DataLens: Export Report` | — | Export the current analysis as HTML or Markdown |
| `DataLens: Focus Preview Tab` | — | Switch to the raw data preview tab |
| `DataLens: Focus Summary Tab` | — | Switch to the dataset summary tab |

---

## Progressive Rendering

Because analysis of large datasets can take several seconds, the UI must communicate progress clearly rather than showing a blank panel.

**Rendering sequence:**

1. File opens → panel appears immediately with skeleton cards (greyed-out placeholders in the correct layout).
2. Within ~500ms → file metadata and row/column count are shown. The Preview tab is populated.
3. Within ~2s → Summary statistics and missing value chart are rendered.
4. Background → correlation heatmap, outlier detection, and quality score complete and replace their skeleton cards as they finish.
5. A subtle progress bar runs across the top of the panel during background analysis. It disappears when all cards are complete.

For sampled datasets, each card displays a "⚡ Sampled" badge until full analysis completes.

---

## User Experience Goals

DataLens should feel:

- Fast — results appear progressively, not all at once
- Clean — cards are collapsible; the most critical information is shown first
- Intuitive — no configuration required for a first analysis
- Reliable — errors are shown inside the panel, not as disruptive VS Code popups
- Non-intrusive — does not activate automatically or modify any file
- Useful even for large datasets — via sampling and background analysis

---

## Suggested UI Layout

DataLens uses two VS Code UI surfaces:

### Sidebar Tree View (`contributes.views`)

- Lists recently analyzed files
- Displays the currently open dataset name, row count, and quality score badge
- Provides quick-access buttons for Export and Re-analyze

### Main Webview Panel (editor tab)

The webview opens as an editor tab and contains the following tab bar:

| Tab | Contents |
|---|---|
| **Preview** | Scrollable raw data table (first 100 rows) |
| **Summary** | Overview cards, statistics table, missing values chart |
| **Correlations** | Correlation heatmap |
| **Quality** | Quality score breakdown, outlier summary |
| **Columns** | Per-column insight cards |

A status bar at the bottom of the webview shows analysis status, warnings, and the Export button.

---

## Technical Architecture

### Frontend

- VS Code Extension API (`vscode` namespace)
- Webview (`vscode.WebviewPanel`) for the main analysis panel
- TypeScript for all extension host logic
- React + lightweight charting library (e.g., Recharts or Chart.js) inside the webview

### Python Bridge

Analysis is performed by a Python subprocess managed by the extension host. The chosen approach is a **persistent Python server** running as a child process:

- On extension activation, the host spawns a local HTTP server (e.g., FastAPI on a random available port) as a child process.
- The extension host communicates with the server via `localhost` HTTP calls (`fetch`).
- The server process is terminated when VS Code closes or the extension is deactivated.
- If the server fails to start (e.g., Python not found), the extension falls back to TypeScript-only analysis with reduced feature support and displays a warning.

This approach avoids cold-start latency on repeated analyses and keeps the communication protocol simple and debuggable.

### Dependency Management

The extension must handle Python environment setup transparently:

1. On first activation, the extension checks for a Python interpreter using the VS Code Python extension API (`ms-python.python`) if available, or falls back to `python3` / `python` on `PATH`.
2. If a valid interpreter is found, the extension creates a dedicated virtual environment at `~/.vscode/extensions/datalens/.venv`.
3. Required packages (`pandas`, `numpy`, `scipy`, `pyarrow`, `openpyxl`, `fastapi`, `uvicorn`) are installed into this environment on first run. A progress notification is shown during installation.
4. If installation fails or Python is unavailable, the extension displays a clear setup guide panel with OS-specific instructions. TypeScript-only analysis remains available.
5. The extension settings allow users to specify a custom Python interpreter path.

### Webview Communication Protocol

The extension host and webview communicate via `postMessage`. All messages follow this schema:

```ts
// Host → Webview
type HostMessage =
  | { type: "FILE_METADATA"; payload: { rows: number; cols: number; sizeBytes: number } }
  | { type: "PREVIEW_DATA"; payload: { columns: Column[]; rows: Row[] } }
  | { type: "PROFILE_RESULT"; payload: DatasetProfile }
  | { type: "ANALYSIS_ERROR"; payload: { stage: string; message: string } }
  | { type: "ANALYSIS_PROGRESS"; payload: { stage: string; percent: number } };

// Webview → Host
type WebviewMessage =
  | { type: "EXPORT_REPORT"; payload: { format: "html" | "markdown" } }
  | { type: "RE_ANALYZE" }
  | { type: "OPEN_FILE" };
```

### Python Libraries

- `pandas` — data loading and profiling
- `numpy` — numerical operations
- `scipy` — statistical tests, outlier detection
- `pyarrow` — Parquet support
- `openpyxl` — Excel support
- `fastapi` + `uvicorn` — local analysis server
- `matplotlib` / `plotly` — optional for server-side chart generation (prefer client-side rendering where possible)

### Core Modules

- **File parsing service** — format detection, loading, normalization
- **Dataset profiling engine** — statistics, missing values, duplicates
- **Correlation service** — pairwise correlation computation
- **Outlier detection service** — IQR and z-score analysis
- **Quality scoring service** — weighted penalty model
- **Visualization service** — prepares data structures for webview charts
- **Report generator** — HTML and Markdown export
- **AI insight module** (optional) — plain-language summaries via external API
- **Python bridge manager** — lifecycle management of the analysis server

---

## Data Processing Workflow

1. User triggers DataLens on a supported file.
2. The extension detects the file type and size.
3. If the file exceeds the large-file threshold, a sampling notice is shown.
4. The Python bridge sends metadata and a preview payload immediately.
5. The webview renders skeleton cards and populates the Preview tab.
6. The profiling engine computes summary statistics; results are streamed to the webview as each stage completes.
7. Missing values, duplicates, correlations, and outliers are analyzed in sequence.
8. The quality score is computed last and rendered when all factors are available.
9. The user can export a report or inspect a specific column at any point after step 5.

---

## Performance Considerations

**File size thresholds:**

| File Size | Behavior |
|---|---|
| Under 50 MB | Fully loaded and analyzed |
| 50 MB – 500 MB | Sampled at 100,000 rows for display and initial analysis; background full-file analysis runs if enabled |
| Over 500 MB | Requires explicit user confirmation before loading; sample-only mode by default |

Additional optimizations:

- Background analysis runs in the Python subprocess to avoid blocking the extension host thread
- Webview charts use client-side rendering to avoid round-trips for interactivity
- The correlation matrix is computed only for numeric columns; datasets with more than 50 numeric columns show a warning and require confirmation
- Memory-efficient parsing uses chunked reading where supported (pandas `chunksize`)

---

## Error Handling

Errors should be surfaced **inside the DataLens panel**, not as VS Code notification popups that auto-dismiss. Each error state has a defined in-panel display:

| Error | Panel Behavior |
|---|---|
| File not found or inaccessible | Full-panel error card with file path and retry button |
| Corrupt or unparseable file | Error card with detected file type, parse error message, and suggestion to check encoding |
| Python not available | Setup guide panel with OS-specific installation instructions |
| Python server failed to start | Error card with server log output and a "Retry" button |
| Analysis timed out | Partial results shown; timeout notice with option to run in sample-only mode |
| Empty file | Clear notice: "This file contains no data" |
| Missing headers | Warning banner above preview: "No header row detected — columns named Column_1, Column_2, …" |

---

## Edge Cases to Handle

| Edge Case | Handling |
|---|---|
| Empty files | Show empty-state card; no analysis attempted |
| Single-column datasets | Suppress correlation heatmap; show notice |
| Mixed data types in one column | Flag column as "Mixed type"; include in invalid-type penalty |
| Corrupt files | Show in-panel error with parse details |
| Files over 500 MB | Require confirmation; default to sample mode |
| Missing headers | Auto-generate column names; show warning |
| Non-UTF-8 encodings | Attempt common encoding detection (latin-1, windows-1252); show banner if fallback was used |
| Nested JSON (>1 level deep) | Flatten one level; serialize deeper nesting as string; show notice |
| JSON arrays of primitives | Treat as single-column dataset |
| Parquet with complex types | Stringify unsupported types; flag in column insights |

---

## Extension Settings Schema

The following settings should be registered under `contributes.configuration`:

```json
{
  "datalens.pythonPath": {
    "type": "string",
    "default": "",
    "description": "Path to a Python interpreter. If empty, DataLens uses the VS Code Python extension interpreter or system Python."
  },
  "datalens.sampleSizeRows": {
    "type": "number",
    "default": 100000,
    "description": "Number of rows to sample for files exceeding the large-file threshold."
  },
  "datalens.largeFileThresholdMB": {
    "type": "number",
    "default": 50,
    "description": "Files larger than this value (in MB) will be sampled rather than fully loaded."
  },
  "datalens.enableAIFeatures": {
    "type": "boolean",
    "default": false,
    "description": "Enable AI-powered dataset explanation and feature suggestions. Requires an API key and sends summary data to an external service."
  },
  "datalens.defaultExportFormat": {
    "type": "string",
    "enum": ["html", "markdown"],
    "default": "html",
    "description": "Default format for exported EDA reports."
  },
  "datalens.exportPath": {
    "type": "string",
    "default": "",
    "description": "Default directory for exported reports. If empty, uses the directory of the analyzed file."
  },
  "datalens.correlationMethod": {
    "type": "string",
    "enum": ["pearson", "spearman"],
    "default": "pearson",
    "description": "Correlation method used for the heatmap."
  }
}
```

---

## Testing Strategy

### Unit Tests

The profiling engine consists of pure functions that are straightforward to test:

- Statistics calculations (mean, median, std, quartiles) tested against known datasets
- Quality score penalty logic tested at boundary thresholds (e.g., exactly 5% missing, exactly 20% missing)
- Outlier detection tested with synthetic datasets containing known outliers
- Nested JSON flattening logic tested against various nesting patterns

Test runner: **Vitest** or **Jest** for TypeScript; **pytest** for Python analysis modules.

### Integration Tests

- File parsing tested with fixture files covering all supported formats and edge cases (empty file, missing headers, non-UTF-8, corrupt file)
- Python server startup and shutdown lifecycle tested
- Webview message protocol tested with a mock webview

### Snapshot Tests

- Exported HTML and Markdown reports tested against approved snapshots to catch regressions in report structure

### Fixture Files

A `/test/fixtures` directory should include sample files for:

- Small clean CSV (smoke tests)
- CSV with missing values, duplicates, outliers
- CSV with non-UTF-8 encoding
- Excel file with multiple sheets
- Parquet file
- Nested JSON
- Empty file
- Single-column file
- 500k-row CSV (large file behavior)

---

## Security and Privacy Considerations

- All analysis is performed locally by default; no data is sent externally
- The Python server binds to `127.0.0.1` only, never to `0.0.0.0`
- The server port is randomly selected from the ephemeral range to avoid conflicts
- AI features are opt-in, clearly labeled, and gated behind a setting; the extension explicitly notifies the user before any data leaves the machine
- Exported reports should not include more than the first 20 rows of raw data by default to reduce accidental sensitive data leakage

---

## Success Metrics

The project can be judged by:

- Speed of dataset profiling (target: summary visible within 2 seconds for files under 50 MB)
- Accuracy of statistics and quality checks
- Clarity of the UI and error states
- Support for multiple file formats
- User adoption among students and analysts
- Ability to generate useful, shareable reports

---

## Suggested MVP Scope

A strong first version should include:

- CSV and JSON support
- Raw data preview (first 100 rows)
- Dataset summary
- Missing value detection
- Duplicate detection
- Basic statistics
- Correlation heatmap
- Outlier detection
- Data quality score
- In-panel error handling
- Simple exportable HTML report

---

## Roadmap

### Version 1.0

- CSV and JSON support
- Raw data preview tab
- EDA summary panel
- Missing values and duplicates
- Statistics and correlation heatmap
- Outlier detection
- Quality score
- Export report (HTML)
- Full in-panel error handling

### Version 1.5

- Parquet and Excel support
- Improved correlation view (Spearman option, column filtering)
- Column-level insights panel
- Better performance for large files (background full analysis)
- Markdown export

### Version 2.0

- AI dataset explanation (opt-in)
- Feature engineering suggestions
- Dataset comparison
- Advanced profiling presets
- VS Code Marketplace publication

---

## Versioning Policy

DataLens follows [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.x): Bug fixes, performance improvements, no behavior changes
- **Minor** (1.x.0): New features, backwards-compatible; new optional settings
- **Major** (x.0.0): Breaking changes, such as report format changes, renamed settings, or removed commands

Report format (HTML/Markdown structure) is considered a public contract from v1.0 onward. Changes to the format that would break downstream consumers require a major version bump.

---

## Final Vision

DataLens should become a lightweight, intelligent dataset companion inside VS Code. Its goal is not to replace advanced analytics platforms, but to make early dataset review faster, cleaner, and more accessible for analysts and students.

By combining profiling, visualization, quality scoring, and a clear error model in a single workflow, DataLens can become a genuinely useful tool rather than just another portfolio demo.