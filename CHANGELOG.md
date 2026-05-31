# Changelog

## [1.0.4] - 2026-05-31

### Fixed
- Fixed UTF-8 encoding detection heuristic to prevent files with literal replacement characters (like `spam.csv`) from being incorrectly identified as Latin-1/ISO-8859-1.

## [1.0.3] - 2026-05-31

### Changed
- Updated `.gitignore` with comprehensive node, vscode, and webview patterns.

## [1.0.2] - 2026-05-31

### Changed
- Removed redundant logo from README and resized extension icon to standard 128x128.

## [1.0.1] - 2026-05-31

### Fixed
- Fixed schema warning by adding icon to recent-files tree view.

## [1.0.0] - 2026-05-31

### Added
- CSV and JSON file support with encoding detection
- Raw data preview (first 100 rows, sortable, null highlighting)
- Dataset summary (rows, columns, file size, memory, missing %, duplicates)
- Automatic column type inference (numeric, categorical, datetime, boolean, mixed)
- Descriptive statistics (mean, median, std dev, quartiles, skewness)
- Missing value analysis with severity-sorted bar chart
- Duplicate row detection with count and percentage
- Pearson and Spearman correlation heatmap
- IQR-based outlier detection with extreme value reporting
- Data quality score (0-100) with 5-factor penalty breakdown
- Per-column insight cards with distribution charts and suggestions
- Self-contained HTML report export
- Sidebar tree view with recently analyzed files
- Progressive rendering with skeleton loading states
- In-panel error handling (no popup notifications)
- Nested JSON auto-flattening (one level)
- Large file sampling with configurable thresholds
- Full offline operation — zero network requests
