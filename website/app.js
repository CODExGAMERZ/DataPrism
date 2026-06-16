/**
 * DataPrism Standalone Website Controller
 * Fully offline, client-side dataset parsing, profiling, and dashboard rendering.
 */

(function () {
  // DOM Elements
  const navbar = document.getElementById('navbar');
  const uploadContainer = document.getElementById('sim-upload-container');
  const loadingContainer = document.getElementById('sim-loading-container');
  const dashboardContainer = document.getElementById('sim-dashboard-container');
  
  const fileInput = document.getElementById('sim-file-input');
  const btnLoadSample = document.getElementById('btn-load-sample');
  const btnReanalyze = document.getElementById('sim-btn-reanalyze');
  const btnExport = document.getElementById('sim-btn-export');
  
  const loadingStage = document.getElementById('loading-stage');
  const loadingDetails = document.getElementById('loading-details');
  const progressBarFill = document.getElementById('sim-progress-bar');
  
  const fileTitleText = document.getElementById('simulator-file-title');
  const footerStatusDetails = document.getElementById('footer-status-details');
  const footerStatusScore = document.getElementById('footer-status-score');
  
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // State
  let currentFile = { name: '', size: 0, content: '' };
  let analysisResult = null;
  let activeTab = 'preview';

  // Sample Dataset
  const SAMPLE_CSV = `Name,Age,Salary,Department,JoinedDate,IsRemote
Alice Smith,28,75000,Engineering,2021-03-15,true
Bob Jones,34,92000,Sales,2019-10-01,false
Charlie Brown,45,120000,Engineering,2015-06-20,true
Diana Prince,29,88000,Marketing,2022-01-10,true
Ethan Hunt,38,105000,Operations,2018-05-12,false
Fiona Gallagher,,62000,Sales,2023-08-01,true
George Clark,50,,Engineering,2012-11-30,false
Hannah Abbott,26,58000,Marketing,2023-04-15,true
Ian Malcolm,42,115000,Research,2016-09-05,false
Julia Roberts,31,95000,Operations,,true`;

  // Init
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.style.background = 'rgba(9, 9, 11, 0.9)';
      navbar.style.padding = '5px 0';
    } else {
      navbar.style.background = 'rgba(9, 9, 11, 0.7)';
      navbar.style.padding = '0';
    }
  });

  // Mobile Hamburger Menu Toggle
  const navHamburger = document.getElementById('navHamburger');
  const navLinks = document.getElementById('navLinks');

  if (navHamburger && navLinks) {
    navHamburger.addEventListener('click', () => {
      navHamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navHamburger.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }

  // Tab Switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  function switchTab(tabName) {
    activeTab = tabName;
    tabButtons.forEach(b => b.classList.remove('active'));
    tabPanes.forEach(p => p.classList.remove('active'));

    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    const activePane = document.getElementById(`tab-${tabName}`);
    
    if (activeBtn) activeBtn.classList.add('active');
    if (activePane) activePane.classList.add('active');

    if (tabName === 'correlations' && analysisResult) {
      // Re-draw SVG correlations matrix to fit the dimensions
      setTimeout(() => renderCorrelationHeatmap(analysisResult.correlation), 50);
    }
  }

  // Upload Handlers
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      currentFile.name = file.name;
      currentFile.size = file.size;
      const text = await file.text();
      currentFile.content = text;
      runAnalysis();
    }
  });

  btnLoadSample.addEventListener('click', () => {
    currentFile.name = 'employees_sample.csv';
    currentFile.size = SAMPLE_CSV.length;
    currentFile.content = SAMPLE_CSV;
    runAnalysis();
  });

  btnReanalyze.addEventListener('click', () => {
    resetDashboard();
  });

  btnExport.addEventListener('click', () => {
    exportHtmlReport();
  });

  // Drag and Drop
  uploadContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadContainer.style.borderColor = 'var(--accent-primary)';
  });

  uploadContainer.addEventListener('dragleave', () => {
    uploadContainer.style.borderColor = 'rgba(129, 140, 248, 0.4)';
  });

  uploadContainer.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadContainer.style.borderColor = 'rgba(129, 140, 248, 0.4)';
    const file = e.dataTransfer.files[0];
    if (file) {
      currentFile.name = file.name;
      currentFile.size = file.size;
      const text = await file.text();
      currentFile.content = text;
      runAnalysis();
    }
  });

  function resetDashboard() {
    uploadContainer.classList.add('active');
    loadingContainer.classList.remove('active');
    dashboardContainer.classList.remove('active');
    btnExport.disabled = true;
    fileTitleText.textContent = 'DataPrism Panel';
    footerStatusDetails.textContent = 'DataPrism Offline Sandbox';
    footerStatusScore.textContent = '';
    analysisResult = null;
  }

  // Analytics Engine
  async function runAnalysis() {
    uploadContainer.classList.remove('active');
    loadingContainer.classList.add('active');
    
    try {
      updateProgress('metadata', 5, 'Reading file structure...');
      await sleep(150);

      const ext = currentFile.name.split('.').pop().toLowerCase();
      if (ext !== 'csv' && ext !== 'json') {
        throw new Error('Unsupported file extension. Only .csv and .json files are supported.');
      }

      // 1. Parsing
      updateProgress('preview', 15, 'Parsing cell values...');
      await sleep(150);
      let parsedData;
      if (ext === 'csv') {
        parsedData = parseCsv(currentFile.content);
      } else {
        parsedData = parseJson(currentFile.content);
      }

      if (parsedData.rows.length === 0) {
        throw new Error('This file contains no records.');
      }

      // 2. Metadata & Preview
      const metadata = buildMetadata(currentFile.name, currentFile.size, parsedData);
      const preview = buildPreview(parsedData);
      
      // 3. Column Profiling
      updateProgress('columns', 30, 'Profiling column formats...');
      await sleep(200);
      const columns = profileColumns(parsedData.headers, parsedData.rows);

      // 4. Missing Values
      updateProgress('missing', 50, 'Analyzing missing cells...');
      await sleep(150);
      const missing = analyzeMissingValues(parsedData.headers, parsedData.rows);

      // 5. Duplicates
      updateProgress('duplicates', 65, 'Detecting duplicate rows...');
      await sleep(150);
      const duplicates = analyzeDuplicates(parsedData.rows);

      // 6. Correlations
      updateProgress('correlation', 80, 'Computing correlations...');
      await sleep(200);
      const correlation = computeCorrelation(parsedData.headers, parsedData.rows);

      // 7. Outliers
      updateProgress('outliers', 90, 'Filtering outliers...');
      await sleep(150);
      const outliers = detectOutliers(parsedData.headers, parsedData.rows);

      // 8. Quality Score & Insights
      updateProgress('quality', 95, 'Rating dataset health...');
      await sleep(100);
      const quality = computeQualityScore(missing, duplicates, outliers, columns, parsedData.rows);
      const insights = generateInsights(metadata, columns, missing, duplicates, correlation, outliers, quality);

      // Combine
      analysisResult = {
        metadata,
        preview,
        columns,
        missing,
        duplicates,
        correlation,
        outliers,
        quality,
        insights
      };

      updateProgress('complete', 100, 'Done!');
      await sleep(100);

      // Show Dashboard
      loadingContainer.classList.remove('active');
      dashboardContainer.classList.add('active');
      btnExport.disabled = false;
      
      fileTitleText.textContent = metadata.fileName;
      footerStatusDetails.textContent = `${metadata.fileName} · ${metadata.rows.toLocaleString()} rows × ${metadata.cols} cols`;
      footerStatusScore.textContent = `Quality Score: ${quality.score}/100`;

      // Render tab views
      populatePreviewTab(preview, metadata);
      populateSummaryTab(metadata, duplicates, columns, missing);
      populateInsightsTab(insights);
      renderCorrelationHeatmap(correlation);
      populateQualityTab(quality, outliers);
      populateColumnsTab(columns);
      
      switchTab('preview');
      
    } catch (err) {
      loadingContainer.classList.remove('active');
      uploadContainer.classList.add('active');
      alert('Analysis Error: ' + err.message);
    }
  }

  function updateProgress(stage, percent, details) {
    progressBarFill.style.width = percent + '%';
    loadingStage.textContent = `Stage: ${stage.toUpperCase()}`;
    loadingDetails.textContent = details;
  }

  // --- PARSERS ---
  function parseCsvLine(line) {
    const fields = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          fields.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
    }
    fields.push(current);
    return fields;
  }

  function parseCsv(content) {
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    const firstLine = parseCsvLine(lines[0]);
    const isHeader = firstLine.every(f => isNaN(Number(f)) || f.trim().length === 0);
    const headers = isHeader
      ? firstLine.map((h, i) => h.trim() || `Column_${i + 1}`)
      : firstLine.map((_, i) => `Column_${i + 1}`);

    const dataStart = isHeader ? 1 : 0;
    const rows = [];
    
    // limit rows in simulator to max 5000 to keep it lightning fast
    const maxRows = Math.min(lines.length, 5000);
    for (let i = dataStart; i < maxRows; i++) {
      const fields = parseCsvLine(lines[i]);
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        const raw = fields[j]?.trim();
        row[headers[j]] = (raw === undefined || raw === "") ? null : parseValue(raw);
      }
      rows.push(row);
    }
    return { headers, rows, totalCount: lines.length - dataStart };
  }

  function parseJson(content) {
    let parsed = JSON.parse(content);
    let records = [];
    let didFlatten = false;
    
    if (Array.isArray(parsed)) {
      if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
        const flat = flattenRecords(parsed);
        records = flat.rows;
        didFlatten = flat.didFlatten;
      } else {
        records = parsed.map((v, i) => ({ index: i, value: v }));
      }
    } else if (typeof parsed === 'object' && parsed !== null) {
      const flat = flattenRecords([parsed]);
      records = flat.rows;
      didFlatten = flat.didFlatten;
    } else {
      records = [{ value: parsed }];
    }

    const maxRows = Math.min(records.length, 5000);
    const sliced = records.slice(0, maxRows);
    const headerSet = new Set();
    sliced.forEach(r => Object.keys(r).forEach(k => headerSet.add(k)));
    const headers = Array.from(headerSet);

    const rows = sliced.map(r => {
      const row = {};
      headers.forEach(h => {
        row[h] = r[h] === undefined ? null : r[h];
      });
      return row;
    });

    return { headers, rows, totalCount: records.length, didFlatten };
  }

  function flattenRecords(records) {
    let didFlatten = false;
    const rows = records.map(record => {
      const flat = {};
      for (const [key, value] of Object.entries(record)) {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          didFlatten = true;
          for (const [subKey, subValue] of Object.entries(value)) {
            if (subValue !== null && typeof subValue === 'object') {
              flat[`${key}.${subKey}`] = JSON.stringify(subValue);
            } else {
              flat[`${key}.${subKey}`] = subValue;
            }
          }
        } else if (Array.isArray(value)) {
          flat[key] = JSON.stringify(value);
        } else {
          flat[key] = value;
        }
      }
      return flat;
    });
    return { rows, didFlatten };
  }

  function parseValue(raw) {
    if (raw.toLowerCase() === 'true') return true;
    if (raw.toLowerCase() === 'false') return false;
    if (raw.toLowerCase() === 'null' || raw.toLowerCase() === 'na' || raw.toLowerCase() === 'n/a') return null;
    const num = Number(raw);
    if (!isNaN(num) && raw.trim().length > 0) return num;
    const dateMs = Date.parse(raw);
    if (!isNaN(dateMs) && raw.length >= 8 && /[\/\-]/.test(raw)) {
      return new Date(dateMs).toISOString();
    }
    return raw;
  }

  function buildMetadata(fileName, sizeBytes, parsed) {
    return {
      fileName,
      fileType: fileName.split('.').pop().toLowerCase(),
      rows: parsed.totalCount || parsed.rows.length,
      cols: parsed.headers.length,
      sizeBytes,
      memoryUsageMB: Math.round((contentLength(parsed.rows) / 1024 / 1024) * 100) / 100,
      sampled: (parsed.totalCount || parsed.rows.length) > parsed.rows.length,
      sampledRows: parsed.rows.length,
      encodingUsed: 'UTF-8',
      flatteningApplied: parsed.didFlatten || false
    };
  }

  function contentLength(rows) {
    return JSON.stringify(rows.slice(0, 100)).length * (rows.length / Math.min(100, rows.length));
  }

  function buildPreview(parsed) {
    const previewRows = parsed.rows.slice(0, 100);
    const columns = parsed.headers.map(name => {
      const vals = previewRows.map(r => r[name]);
      return { name, type: inferColumnType(vals) };
    });
    return { columns, rows: previewRows };
  }

  // --- TYPE INFERENCE ---
  function inferColumnType(values) {
    const nonNulls = values.filter(v => v !== null && v !== undefined);
    if (nonNulls.length === 0) return 'empty';
    
    let numericCount = 0;
    let booleanCount = 0;
    let dateCount = 0;
    let stringCount = 0;

    nonNulls.forEach(v => {
      if (typeof v === 'number') numericCount++;
      else if (typeof v === 'boolean') booleanCount++;
      else if (typeof v === 'string') {
        if (!isNaN(Date.parse(v)) && v.length >= 8 && /[\/\-]/.test(v)) dateCount++;
        else booleanCount++;
      } else {
        stringCount++;
      }
    });

    const total = nonNulls.length;
    if (numericCount / total > 0.8) return 'numeric';
    if (booleanCount / total > 0.8) return 'boolean';
    if (dateCount / total > 0.8) return 'datetime';
    return 'categorical';
  }

  // --- STATS CALCULATIONS ---
  function profileColumns(headers, rows) {
    return headers.map(name => {
      const values = rows.map(r => r[name]);
      const type = inferColumnType(values);
      const nonNulls = values.filter(v => v !== null && v !== undefined);
      
      const info = {
        name,
        type,
        nullCount: values.length - nonNulls.length,
        nullPercentage: Math.round(((values.length - nonNulls.length) / values.length) * 100),
        uniqueCount: new Set(nonNulls).size,
        totalCount: values.length,
        sampleValues: nonNulls.slice(0, 5)
      };

      const profile = { info };

      if (type === 'numeric' && nonNulls.length > 0) {
        const nums = nonNulls.map(Number).sort((a, b) => a - b);
        const count = nums.length;
        const mean = nums.reduce((s, x) => s + x, 0) / count;
        const stdDev = Math.sqrt(nums.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / count);
        
        profile.numericStats = {
          count,
          mean: Math.round(mean * 100) / 100,
          median: getPercentile(nums, 50),
          stdDev: Math.round(stdDev * 100) / 100,
          min: nums[0],
          max: nums[nums.length - 1],
          q25: getPercentile(nums, 25),
          q50: getPercentile(nums, 50),
          q75: getPercentile(nums, 75),
          skewness: getSkewness(nums, mean, stdDev)
        };
      } else if (type === 'categorical' && nonNulls.length > 0) {
        const freqMap = {};
        nonNulls.forEach(v => freqMap[v] = (freqMap[v] || 0) + 1);
        const sorted = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
        
        profile.categoricalStats = {
          uniqueCount: sorted.length,
          topValue: sorted[0][0],
          topFrequency: sorted[0][1],
          topPercentage: Math.round((sorted[0][1] / nonNulls.length) * 100),
          distribution: sorted.slice(0, 10).map(([value, count]) => ({
            value,
            count,
            percentage: Math.round((count / nonNulls.length) * 100)
          }))
        };
      } else if (type === 'datetime' && nonNulls.length > 0) {
        const dates = nonNulls.map(v => new Date(v).getTime()).sort((a,b) => a-b);
        profile.datetimeStats = {
          minDate: new Date(dates[0]).toISOString().split('T')[0],
          maxDate: new Date(dates[dates.length - 1]).toISOString().split('T')[0],
          rangeDays: Math.round((dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24)),
          missingCount: info.nullCount
        };
      }
      return profile;
    });
  }

  function getPercentile(arr, p) {
    if (arr.length === 0) return 0;
    if (p <= 0) return arr[0];
    if (p >= 100) return arr[arr.length - 1];
    
    const index = (p / 100) * (arr.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    return Math.round((arr[lower] * (1 - weight) + arr[upper] * weight) * 100) / 100;
  }

  function getSkewness(arr, mean, stdDev) {
    if (arr.length < 3 || stdDev === 0) return 0;
    const n = arr.length;
    const cubedDiffsSum = arr.reduce((s, x) => s + Math.pow(x - mean, 3), 0);
    const skew = (cubedDiffsSum / n) / Math.pow(stdDev, 3);
    return Math.round(skew * 100) / 100;
  }

  function analyzeMissingValues(headers, rows) {
    const colsCount = headers.length;
    const rowsCount = rows.length;
    const totalCells = colsCount * rowsCount;
    
    const columns = headers.map(name => {
      const missing = rows.filter(r => r[name] === null || r[name] === undefined).length;
      return {
        name,
        missing,
        percentage: Math.round((missing / rowsCount) * 100)
      };
    });

    const totalMissing = columns.reduce((s, c) => s + c.missing, 0);

    return {
      totalMissing,
      totalCells,
      overallPercentage: Math.round((totalMissing / totalCells) * 100),
      columns
    };
  }

  function analyzeDuplicates(rows) {
    const stringified = rows.map(r => JSON.stringify(r));
    const set = new Set(stringified);
    const totalDuplicates = rows.length - set.size;
    
    // Simple index extraction
    const seen = {};
    const duplicateIndices = [];
    stringified.forEach((str, idx) => {
      if (seen[str]) {
        duplicateIndices.push(idx);
      } else {
        seen[str] = true;
      }
    });

    return {
      totalDuplicates,
      duplicatePercentage: Math.round((totalDuplicates / rows.length) * 100),
      duplicateIndices: duplicateIndices.slice(0, 100)
    };
  }

  // Tukey Outliers (IQR)
  function detectOutliers(headers, rows) {
    const results = [];
    
    headers.forEach(col => {
      const vals = rows.map(r => r[col]).filter(v => typeof v === 'number').sort((a,b) => a-b);
      if (vals.length < 4) return;

      const q25 = getPercentile(vals, 25);
      const q75 = getPercentile(vals, 75);
      const iqr = q75 - q25;
      
      const lower = q25 - 1.5 * iqr;
      const upper = q75 + 1.5 * iqr;

      const extremeIndices = [];
      const extremes = [];
      
      rows.forEach((row, idx) => {
        const val = row[col];
        if (typeof val === 'number') {
          if (val < lower || val > upper) {
            extremeIndices.push(idx);
            extremes.push({ value: val, index: idx });
          }
        }
      });

      if (extremes.length > 0) {
        results.push({
          column: col,
          method: 'IQR Tukey Bounds',
          outlierCount: extremes.length,
          outlierPercentage: Math.round((extremes.length / rows.length) * 100),
          extremeValues: extremes.slice(0, 5)
        });
      }
    });

    return results;
  }

  // Pearson correlation
  function computeCorrelation(headers, rows) {
    const numericCols = headers.filter(col => {
      const vals = rows.map(r => r[col]);
      return inferColumnType(vals) === 'numeric';
    });

    if (numericCols.length < 2) return null;

    const values = [];
    const labels = numericCols;

    for (let i = 0; i < labels.length; i++) {
      values[i] = [];
      for (let j = 0; j < labels.length; j++) {
        if (i === j) {
          values[i][j] = 1.0;
        } else {
          const colA = rows.map(r => r[labels[i]]).filter(v => typeof v === 'number');
          const colB = rows.map(r => r[labels[j]]).filter(v => typeof v === 'number');
          
          // Align datasets in case of nulls
          const paired = [];
          rows.forEach(row => {
            const valA = row[labels[i]];
            const valB = row[labels[j]];
            if (typeof valA === 'number' && typeof valB === 'number') {
              paired.push([valA, valB]);
            }
          });

          if (paired.length < 3) {
            values[i][j] = 0;
            continue;
          }

          const meanA = paired.reduce((s, p) => s + p[0], 0) / paired.length;
          const meanB = paired.reduce((s, p) => s + p[1], 0) / paired.length;
          
          let num = 0;
          let denA = 0;
          let denB = 0;

          paired.forEach(([a, b]) => {
            const diffA = a - meanA;
            const diffB = b - meanB;
            num += diffA * diffB;
            denA += Math.pow(diffA, 2);
            denB += Math.pow(diffB, 2);
          });

          const den = Math.sqrt(denA * denB);
          values[i][j] = den === 0 ? 0 : Math.round((num / den) * 100) / 100;
        }
      }
    }

    return { labels, values, method: 'pearson' };
  }

  // Health grading
  function computeQualityScore(missing, duplicates, outliers, columns, rows) {
    let score = 100;
    const penalties = [];

    // 1. Missing Values penalty
    if (missing.overallPercentage > 0) {
      const penalty = Math.min(25, missing.overallPercentage * 2.5);
      score -= penalty;
      penalties.push({
        factor: 'Missing Cells Ratio',
        penalty: Math.round(penalty),
        maxPenalty: 25,
        detail: `Overall missing cells ratio is ${missing.overallPercentage}%.`
      });
    }

    // 2. Duplicates penalty
    if (duplicates.duplicatePercentage > 0) {
      const penalty = Math.min(15, duplicates.duplicatePercentage * 1.5);
      score -= penalty;
      penalties.push({
        factor: 'Row Duplication',
        penalty: Math.round(penalty),
        maxPenalty: 15,
        detail: `Row duplication ratio is ${duplicates.duplicatePercentage}%.`
      });
    }

    // 3. Outlier density penalty
    const totalOutliers = outliers.reduce((s, o) => s + o.outlierCount, 0);
    const totalCells = columns.length * rows.length;
    const outlierPct = (totalOutliers / totalCells) * 100;
    if (outlierPct > 0.5) {
      const penalty = Math.min(15, (outlierPct - 0.5) * 8);
      score -= penalty;
      penalties.push({
        factor: 'Outlier Density',
        penalty: Math.round(penalty),
        maxPenalty: 15,
        detail: `Outlier density of ${Math.round(outlierPct*100)/100}% flags statistical anomalies.`
      });
    }

    // 4. Low data volume check
    if (rows.length < 50) {
      score -= 10;
      penalties.push({
        factor: 'Insufficent Data Volume',
        penalty: 10,
        maxPenalty: 10,
        detail: `Sample volume of ${rows.length} rows is statistically insufficient for training ML predictors.`
      });
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    let summary = 'Excellent dataset structure with zero or minimal quality penalties. Ready for modelling pipelines.';
    if (score < 50) summary = 'Poor dataset health. Severe structural errors (missing columns, heavy replication) need immediate formatting.';
    else if (score < 80) summary = 'Fair dataset status. Minor null imbalances or outlier deviations detected.';

    return { score, penalties, summary };
  }

  // Natural language insights generators
  function generateInsights(metadata, columns, missing, duplicates, correlation, outliers, quality) {
    let task = 'Unsupervised Exploration';
    let targetCandidate = 'None';
    
    // Inferred prediction target
    const target = columns.find(c => {
      const name = c.info.name.toLowerCase();
      return name === 'label' || name === 'target' || name === 'class' || name === 'price' || name === 'salary' || name === 'output' || name === 'isremote';
    });
    if (target) {
      task = target.info.type === 'numeric' ? 'Supervised Regression' : 'Supervised Classification';
      targetCandidate = target.info.name;
    }

    const summary = {
      description: `DataPrism analyzed '${metadata.fileName}' containing ${metadata.rows.toLocaleString()} records across ${metadata.cols} features.`,
      assumedTask: task,
      keyPredictors: columns.slice(0, 3).map(c => c.info.name),
      qualityIssuesCount: quality.penalties.length,
      mlSuitability: quality.score > 70 ? 'High' : quality.score > 40 ? 'Moderate' : 'Low'
    };

    const features = [];
    columns.forEach(col => {
      if (col.numericStats) {
        if (col.numericStats.skewness > 1.5) {
          features.push({
            column: col.info.name,
            type: 'Skewed Variable',
            title: `Apply Log Transform on '${col.info.name}'`,
            description: `The feature '${col.info.name}' exhibits right-hand skewness ($g_1 = ${col.numericStats.skewness}$). Applying a logarithmic scaling $\\log(x+1)$ will stabilize distributions.`,
            impact: 'Medium'
          });
        }
      }
    });

    // Correlation leakage checking
    if (correlation) {
      for (let i = 0; i < correlation.labels.length; i++) {
        for (let j = i + 1; j < correlation.labels.length; j++) {
          const val = Math.abs(correlation.values[i][j]);
          if (val > 0.85) {
            features.push({
              column: `${correlation.labels[i]} & ${correlation.labels[j]}`,
              type: 'Multicollinearity',
              title: `High Correlation Matrix Link`,
              description: `Attributes '${correlation.labels[i]}' and '${correlation.labels[j]}' share a high correlation ($r = ${correlation.values[i][j]}$). Consider removing one to reduce multi-collinearity issues.`,
              impact: 'High'
            });
          }
        }
      }
    }

    const missingRecs = [];
    missing.columns.forEach(col => {
      if (col.missing > 0) {
        let strategy = 'Mode Imputation';
        let code = `df['${col.name}'].fillna(df['${col.name}'].mode()[0], inplace=True)`;
        
        const colProf = columns.find(c => c.info.name === col.name);
        if (colProf && colProf.info.type === 'numeric') {
          strategy = 'Median Imputation';
          code = `df['${col.name}'].fillna(df['${col.name}'].median(), inplace=True)`;
        }
        
        missingRecs.push({
          column: col.name,
          missingCount: col.missing,
          percentage: col.percentage,
          recommendation: `This feature contains ${col.percentage}% missing cells. We recommend applying ${strategy} to handle nulls.`,
          strategy,
          codeSnippet: code
        });
      }
    });

    return { summary, features, missing: missingRecs };
  }

  // --- RENDER FUNCTIONS ---
  function populatePreviewTab(preview, metadata) {
    const notice = document.getElementById('preview-notice');
    if (metadata.sampled) {
      notice.style.display = 'block';
      notice.innerHTML = `⚡ <strong>Sampled View</strong> — Displaying first ${metadata.sampledRows.toLocaleString()} rows of ${metadata.rows.toLocaleString()} entries to maintain performance.`;
    } else {
      notice.style.display = 'none';
    }

    const table = document.getElementById('preview-table');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Headers
    const hRow = document.createElement('tr');
    preview.columns.forEach(col => {
      const th = document.createElement('th');
      th.innerHTML = `${col.name} <span class="col-type-tag" style="font-size:0.5rem; display:block; opacity:0.6;">${col.type}</span>`;
      hRow.appendChild(th);
    });
    thead.appendChild(hRow);

    // Rows
    preview.rows.forEach(row => {
      const rRow = document.createElement('tr');
      preview.columns.forEach(col => {
        const td = document.createElement('td');
        const val = row[col.name];
        if (val === null || val === undefined) {
          td.textContent = 'null';
          td.classList.add('null-cell');
        } else {
          td.textContent = typeof val === 'number' ? Math.round(val * 100)/100 : val;
        }
        rRow.appendChild(td);
      });
      tbody.appendChild(rRow);
    });
  }

  function populateSummaryTab(metadata, duplicates, columns, missing) {
    document.getElementById('sum-rows').textContent = metadata.rows.toLocaleString();
    document.getElementById('sum-cols').textContent = metadata.cols.toLocaleString();
    document.getElementById('sum-missing').textContent = `${missing.overallPercentage}%`;
    document.getElementById('sum-duplicates').textContent = `${duplicates.duplicatePercentage}%`;

    const tbody = document.getElementById('stats-table').querySelector('tbody');
    tbody.innerHTML = '';

    columns.forEach(col => {
      const tr = document.createElement('tr');
      
      const tdName = document.createElement('td');
      tdName.innerHTML = `<strong>${col.info.name}</strong>`;
      tr.appendChild(tdName);

      const tdType = document.createElement('td');
      tdType.innerHTML = `<span class="col-type-tag">${col.info.type}</span>`;
      tr.appendChild(tdType);

      const tdNulls = document.createElement('td');
      tdNulls.textContent = `${col.info.nullPercentage}% (${col.info.nullCount})`;
      if (col.info.nullCount > 0) tdNulls.style.color = 'var(--warning)';
      tr.appendChild(tdNulls);

      const tdUniques = document.createElement('td');
      tdUniques.textContent = col.info.uniqueCount.toLocaleString();
      tr.appendChild(tdUniques);

      const tdMean = document.createElement('td');
      const tdMin = document.createElement('td');
      const tdMax = document.createElement('td');
      const tdStd = document.createElement('td');

      if (col.numericStats) {
        tdMean.textContent = col.numericStats.mean;
        tdMin.textContent = col.numericStats.min;
        tdMax.textContent = col.numericStats.max;
        tdStd.textContent = col.numericStats.stdDev;
      } else if (col.categoricalStats) {
        tdMean.textContent = col.categoricalStats.topValue;
        tdMin.textContent = col.categoricalStats.topFrequency;
        tdMax.textContent = `${col.categoricalStats.topPercentage}%`;
        tdStd.textContent = '-';
      } else {
        tdMean.textContent = '-';
        tdMin.textContent = '-';
        tdMax.textContent = '-';
        tdStd.textContent = '-';
      }

      tr.appendChild(tdMean);
      tr.appendChild(tdMin);
      tr.appendChild(tdMax);
      tr.appendChild(tdStd);

      tbody.appendChild(tr);
    });
  }

  function populateInsightsTab(insights) {
    document.getElementById('insight-overview-text').textContent = `${insights.summary.description} Inferred task category: ${insights.summary.assumedTask} with ML suitability graded as ${insights.summary.mlSuitability}.`;

    const list = document.getElementById('insight-features-list');
    list.innerHTML = '';
    
    if (insights.features.length === 0) {
      list.innerHTML = `<p style="font-size:0.75rem; color:var(--text-muted);">No major feature engineering recommendations.</p>`;
    } else {
      insights.features.forEach(f => {
        const card = document.createElement('div');
        card.className = `suggest-card ${f.impact}`;
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong>${f.title}</strong>
            <span class="impact-badge ${f.impact}">${f.impact} Impact</span>
          </div>
          <p style="margin-top:4px; font-size:0.7rem; color:var(--text-secondary);">${f.description}</p>
        `;
        list.appendChild(card);
      });
    }

    const recipes = document.getElementById('insight-missing-recipes');
    recipes.innerHTML = '';

    if (insights.missing.length === 0) {
      recipes.innerHTML = `<div style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:20px;">No missing values detected. Your dataset has 100% complete metrics!</div>`;
    } else {
      insights.missing.forEach(m => {
        const div = document.createElement('div');
        div.className = 'recipe-card';
        div.innerHTML = `
          <div class="recipe-header">
            <span>Column: <code>${m.column}</code></span>
            <span style="color:var(--warning);">${m.percentage}% missing</span>
          </div>
          <p style="font-size:0.7rem; color:var(--text-secondary);">${m.recommendation}</p>
          <div class="recipe-code">${m.codeSnippet}</div>
        `;
        recipes.appendChild(div);
      });
    }
  }

  // Render heatmaps via raw SVG (VoltC style)
  function renderCorrelationHeatmap(correlation) {
    const svg = document.getElementById('correlation-svg');
    svg.innerHTML = '';
    
    if (!correlation) {
      svg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="var(--text-muted)" font-size="11">Not enough numeric columns for correlation analysis</text>`;
      return;
    }

    const labels = correlation.labels;
    const values = correlation.values;
    const n = labels.length;
    
    const margin = { top: 40, right: 10, bottom: 40, left: 60 };
    const width = svg.clientWidth || 360;
    const height = 300;
    
    const cellWidth = (width - margin.left - margin.right) / n;
    const cellHeight = (height - margin.top - margin.bottom) / n;

    // Draw grid cells
    for (let i = 0; i < n; i++) {
      // Y label
      const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      yLabel.setAttribute('x', margin.left - 8);
      yLabel.setAttribute('y', margin.top + i * cellHeight + cellHeight / 2 + 4);
      yLabel.setAttribute('text-anchor', 'end');
      yLabel.setAttribute('fill', 'var(--text-secondary)');
      yLabel.setAttribute('font-size', '9px');
      yLabel.setAttribute('font-family', 'var(--font-sans)');
      
      // truncate name
      let name = labels[i];
      if (name.length > 8) name = name.slice(0, 6) + '..';
      yLabel.textContent = name;
      svg.appendChild(yLabel);

      // X label
      const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      xLabel.setAttribute('x', margin.left + i * cellWidth + cellWidth / 2);
      xLabel.setAttribute('y', margin.top - 8);
      xLabel.setAttribute('text-anchor', 'middle');
      xLabel.setAttribute('fill', 'var(--text-secondary)');
      xLabel.setAttribute('font-size', '9px');
      xLabel.setAttribute('font-family', 'var(--font-sans)');
      
      let xName = labels[i];
      if (xName.length > 8) xName = xName.slice(0, 6) + '..';
      xLabel.textContent = xName;
      svg.appendChild(xLabel);

      for (let j = 0; j < n; j++) {
        const val = values[i][j];
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', margin.left + j * cellWidth);
        rect.setAttribute('y', margin.top + i * cellHeight);
        rect.setAttribute('width', cellWidth - 1);
        rect.setAttribute('height', cellHeight - 1);
        
        // Color mapping: 1.0 (indigo) -> 0.0 (dark) -> -1.0 (red)
        let fill = 'rgb(17, 24, 39)'; // 0
        if (val > 0) {
          fill = `rgba(129, 140, 248, ${val})`; // Positive
        } else if (val < 0) {
          fill = `rgba(248, 113, 113, ${Math.abs(val)})`; // Negative
        }
        
        rect.setAttribute('fill', fill);
        rect.setAttribute('stroke', 'rgba(255,255,255,0.03)');
        
        // hover tooltip
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${labels[i]} vs ${labels[j]} : ${val}`;
        rect.appendChild(title);
        
        svg.appendChild(rect);

        // Add text values inside boxes if cells are large enough
        if (cellWidth > 26) {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', margin.left + j * cellWidth + cellWidth / 2);
          text.setAttribute('y', margin.top + i * cellHeight + cellHeight / 2 + 4);
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('fill', Math.abs(val) > 0.5 ? '#fff' : 'var(--text-muted)');
          text.setAttribute('font-size', '8px');
          text.setAttribute('font-family', 'var(--font-mono)');
          text.textContent = val;
          svg.appendChild(text);
        }
      }
    }
  }

  function populateQualityTab(quality, outliers) {
    const scoreVal = document.getElementById('quality-score-value');
    if (scoreVal) {
      scoreVal.textContent = quality.score;
    }
    
    // Animate circular SVG progress ring
    const progressCircle = document.getElementById('dial-progress-circle');
    if (progressCircle) {
      const circumference = 2 * Math.PI * 58; // 364.42
      const offset = circumference * (1 - quality.score / 100);
      progressCircle.style.strokeDashoffset = offset;
      
      // Update color based on score
      if (quality.score > 80) progressCircle.style.stroke = 'var(--success)';
      else if (quality.score > 50) progressCircle.style.stroke = 'var(--warning)';
      else progressCircle.style.stroke = 'var(--danger)';
    }

    document.getElementById('quality-grade-summary').textContent = quality.summary;

    const list = document.getElementById('quality-penalty-list');
    list.innerHTML = '';

    if (quality.penalties.length === 0) {
      list.innerHTML = `<li style="color:var(--success); padding:6px 0;"><i class="fa-solid fa-circle-check"></i> 100% clean structure with zero score deductions!</li>`;
    } else {
      quality.penalties.forEach(p => {
        const li = document.createElement('li');
        li.className = 'penalty-item';
        li.innerHTML = `
          <span class="penalty-name">⚠️ <strong>${p.factor}</strong> - <span style="font-size:0.7rem; color:var(--text-secondary);">${p.detail}</span></span>
          <span class="penalty-amount">-${p.penalty} pts</span>
        `;
        list.appendChild(li);
      });
    }

    const otBody = document.getElementById('outliers-table').querySelector('tbody');
    otBody.innerHTML = '';

    if (outliers.length === 0) {
      otBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No statistical outliers detected inside dataset bounds.</td></tr>`;
    } else {
      outliers.forEach(o => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${o.column}</strong></td>
          <td>${o.outlierCount.toLocaleString()}</td>
          <td>${o.outlierPercentage}%</td>
          <td><code>${o.extremeValues.map(x => x.value).join(', ')}</code></td>
        `;
        otBody.appendChild(tr);
      });
    }
  }

  function populateColumnsTab(columns) {
    const grid = document.getElementById('columns-detailed-grid');
    grid.innerHTML = '';

    columns.forEach(col => {
      const card = document.createElement('div');
      card.className = 'col-detail-card';

      let statsHtml = '';
      if (col.numericStats) {
        statsHtml = `
          <div class="col-stats-row">
            <div class="col-stat-item">Mean: <span class="col-stat-val">${col.numericStats.mean}</span></div>
            <div class="col-stat-item">Median: <span class="col-stat-val">${col.numericStats.median}</span></div>
            <div class="col-stat-item">StdDev: <span class="col-stat-val">${col.numericStats.stdDev}</span></div>
          </div>
          <div class="col-stats-row">
            <div class="col-stat-item">Min: <span class="col-stat-val">${col.numericStats.min}</span></div>
            <div class="col-stat-item">Max: <span class="col-stat-val">${col.numericStats.max}</span></div>
            <div class="col-stat-item">Skew: <span class="col-stat-val">${col.numericStats.skewness}</span></div>
          </div>
        `;
      } else if (col.categoricalStats) {
        statsHtml = `
          <div class="col-stats-row" style="grid-template-columns: 1.5fr 1.5fr;">
            <div class="col-stat-item" style="text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">Top: <span class="col-stat-val" title="${col.categoricalStats.topValue}">${col.categoricalStats.topValue}</span></div>
            <div class="col-stat-item">Freq: <span class="col-stat-val">${col.categoricalStats.topFrequency} (${col.categoricalStats.topPercentage}%)</span></div>
          </div>
        `;
      } else if (col.datetimeStats) {
        statsHtml = `
          <div class="col-stats-row" style="grid-template-columns: 1fr 1fr;">
            <div class="col-stat-item">Start: <span class="col-stat-val">${col.datetimeStats.minDate}</span></div>
            <div class="col-stat-item">End: <span class="col-stat-val">${col.datetimeStats.maxDate}</span></div>
          </div>
        `;
      }

      let warningHtml = '';
      if (col.info.nullPercentage > 10) {
        warningHtml = `<div class="col-warn-badge"><i class="fa-solid fa-triangle-exclamation"></i> High Null Count (${col.info.nullPercentage}%)</div>`;
      }

      card.innerHTML = `
        <div class="col-header">
          <span class="col-name">${col.info.name}</span>
          <span class="col-type-tag">${col.info.type}</span>
        </div>
        <div style="font-size:0.65rem; color:var(--text-secondary); margin-bottom:8px;">
          Uniques: <strong>${col.info.uniqueCount.toLocaleString()}</strong> · Nulls: <strong>${col.info.nullCount}</strong>
        </div>
        ${statsHtml}
        ${warningHtml}
      `;

      grid.appendChild(card);
    });
  }

  // --- REPORT EXPORTER ---
  function exportHtmlReport() {
    if (!analysisResult) return;
    
    const { metadata, preview, columns, missing, duplicates, correlation, outliers, quality, insights } = analysisResult;

    // Build the simple HTML report directly
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DataPrism EDA Report - ${metadata.fileName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0f1118; color: #f3f4f6; margin: 0; padding: 30px; }
    .container { max-width: 1000px; margin: 0 auto; background: #161c26; padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h1 { margin-top: 0; font-size: 24px; color: #818cf8; border-bottom: 2px solid rgba(255,255,255,0.06); padding-bottom: 12px; }
    h2 { font-size: 18px; color: #2dd4bf; margin-top: 24px; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 24px; }
    .card { background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 15px; }
    .card-label { font-size: 11px; text-transform: uppercase; color: #6b7280; margin-bottom: 4px; }
    .card-value { font-size: 18px; font-weight: 700; font-family: monospace; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    th { background: rgba(255,255,255,0.02); }
    .code-box { background: #000; padding: 10px; border-radius: 4px; font-family: monospace; color: #2dd4bf; overflow-x: auto; margin-top: 8px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>DataPrism Profile Report · <code>${metadata.fileName}</code></h1>
    
    <div class="grid">
      <div class="card">
        <div class="card-label">Total Rows</div>
        <div class="card-value">${metadata.rows.toLocaleString()}</div>
      </div>
      <div class="card">
        <div class="card-label">Total Columns</div>
        <div class="card-value">${metadata.cols}</div>
      </div>
      <div class="card">
        <div class="card-label">Quality Score</div>
        <div class="card-value" style="color:#34d399">${quality.score}/100</div>
      </div>
      <div class="card">
        <div class="card-label">Missing Cells</div>
        <div class="card-value">${missing.overallPercentage}%</div>
      </div>
    </div>

    <h2>Executive Overview</h2>
    <p>${insights.summary.description} Inferred task: <strong>${insights.summary.assumedTask}</strong>. ML readiness grade: <strong>${insights.summary.mlSuitability}</strong>.</p>
    
    <h2>Feature Engineering Suggestions</h2>
    <ul>
      ${insights.features.map(f => `<li><strong>${f.title}</strong>: ${f.description}</li>`).join('') || '<li>No major issues flagged.</li>'}
    </ul>

    <h2>Missing Value Imputation Recipes</h2>
    ${insights.missing.map(m => `
      <div style="margin-bottom: 15px;">
        <strong>Column: <code>${m.column}</code></strong> (${m.percentage}% missing)
        <p style="margin: 4px 0; font-size:12px; color:#9ca3af;">${m.recommendation}</p>
        <div class="code-box">${m.codeSnippet}</div>
      </div>
    `).join('') || '<p>No missing cells detected.</p>'}

    <h2>Column Profiling Details</h2>
    <table>
      <thead>
        <tr>
          <th>Column Name</th>
          <th>Type</th>
          <th>Nulls (%)</th>
          <th>Uniques</th>
        </tr>
      </thead>
      <tbody>
        ${columns.map(c => `
          <tr>
            <td><strong>${c.info.name}</strong></td>
            <td><code>${c.info.type}</code></td>
            <td>${c.info.nullPercentage}% (${c.info.nullCount})</td>
            <td>${c.info.uniqueCount.toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;

    // Download file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.fileName.split('.')[0]}_profile_report.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Helpers
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

})();
