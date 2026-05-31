import type {
  DatasetProfile,
  ColumnProfile,
  FeatureSuggestion,
  MissingValueRecommendation,
  CompetitionLeakage,
  CompetitionModelSuggestion,
  CompetitionInsights,
  PlainTextSummary,
} from "../types/dataset";

export function generateInsights(profile: Omit<DatasetProfile, "insights">): Required<DatasetProfile>["insights"] {
  const { metadata, columns, missing, duplicates, correlation, outliers, quality } = profile;

  // 1. Identify types count
  let numericCount = 0;
  let categoricalCount = 0;
  let datetimeCount = 0;
  let booleanCount = 0;
  let mixedCount = 0;
  let emptyCount = 0;

  for (const col of columns) {
    switch (col.info.type) {
      case "numeric":
        numericCount++;
        break;
      case "categorical":
        categoricalCount++;
        break;
      case "datetime":
        datetimeCount++;
        break;
      case "boolean":
        booleanCount++;
        break;
      case "mixed":
        mixedCount++;
        break;
      case "empty":
        emptyCount++;
        break;
    }
  }

  // 2. Target Variable Detection
  let targetCol = "";
  const targetRegex = /target|label|class|y|price|churn|survived|status|sales|revenue|income|default/i;
  
  // Try to find target by name
  for (const col of columns) {
    if (targetRegex.test(col.info.name)) {
      targetCol = col.info.name;
      break;
    }
  }
  
  // Fallback to the last column if no target is found
  if (!targetCol && columns.length > 0) {
    targetCol = columns[columns.length - 1].info.name;
  }

  const targetProfile = columns.find(c => c.info.name === targetCol);
  const isTargetCategorical = targetProfile
    ? (targetProfile.info.type === "categorical" || targetProfile.info.type === "boolean")
    : false;
  
  const assumedTask = isTargetCategorical ? "Classification" : "Regression";

  // 3. Plain Text Summary
  const descParts: string[] = [
    `This dataset, loaded from "${metadata.fileName}", contains ${metadata.rows.toLocaleString()} rows and ${metadata.cols} columns.`,
    `It features a mix of schema types, including ${numericCount} numeric, ${categoricalCount} categorical, ${booleanCount} boolean, and ${datetimeCount} datetime columns.`,
  ];
  if (mixedCount > 0) {
    descParts.push(`Note: ${mixedCount} column(s) have mixed data types, which might require clean-up.`);
  }
  if (metadata.sampled) {
    descParts.push(`Analysis was performed on a representative sample of ${metadata.sampledRows?.toLocaleString()} rows to optimize speed.`);
  }
  const description = descParts.join(" ");

  const keyPredictors: string[] = [];
  if (correlation && targetCol) {
    const targetIdx = correlation.labels.indexOf(targetCol);
    if (targetIdx !== -1) {
      const corrList = correlation.labels
        .map((label, idx) => ({ label, score: Math.abs(correlation.values[targetIdx][idx]) }))
        .filter(item => item.label !== targetCol && !isNaN(item.score))
        .sort((a, b) => b.score - a.score);
      
      // Top 3 correlations
      corrList.slice(0, 3).forEach(item => {
        keyPredictors.push(`${item.label} (r = ${correlation.values[targetIdx][correlation.labels.indexOf(item.label)].toFixed(2)})`);
      });
    }
  }

  // If no correlations, pick columns with highest unique variance or numeric columns
  if (keyPredictors.length === 0) {
    const sortedPredictors = [...columns]
      .filter(c => c.info.name !== targetCol && c.info.type === "numeric")
      .slice(0, 3);
    sortedPredictors.forEach(c => keyPredictors.push(c.info.name));
  }

  let mlSuitability = "";
  if (quality.score >= 85) {
    mlSuitability = "Excellent. The dataset exhibits a very high quality score with low missing values and minimal duplicate entries. It is ready for model training with minor feature preparation.";
  } else if (quality.score >= 60) {
    mlSuitability = "Moderate. There are some data quality issues (such as missing values or outliers) that should be addressed using the imputation and engineering recommendations. Models like XGBoost/LightGBM will perform well after basic cleaning.";
  } else {
    mlSuitability = "Low. The dataset has significant data quality issues (e.g. high missingness, case inconsistencies, or severe outliers). Train-test split leakage and biased predictions are highly likely unless the recommended cleaning pipeline is applied.";
  }

  const summary: PlainTextSummary = {
    description,
    assumedTask,
    keyPredictors,
    qualityIssuesCount: duplicates.totalDuplicates + missing.totalMissing,
    mlSuitability,
  };

  // 4. Feature Suggestions
  const features: FeatureSuggestion[] = [];

  for (const col of columns) {
    const name = col.info.name;

    // Numerical Heuristics
    if (col.numericStats) {
      const stats = col.numericStats;
      // High Skewness
      if (Math.abs(stats.skewness) > 1.5) {
        features.push({
          column: name,
          type: "Log Transform",
          title: `Apply Log Transformation to "${name}"`,
          description: `The column has high skewness (${stats.skewness.toFixed(2)}). A log transformation (e.g., np.log1p) will normalize the distribution, which is beneficial for linear models, neural networks, and distance-based metrics.`,
          impact: "High",
        });
      }

      // Large Scale Range
      if (stats.max - stats.min > 1000) {
        features.push({
          column: name,
          type: "Feature Scaling",
          title: `Scale values in "${name}"`,
          description: `The range of values is large (${stats.min} to ${stats.max}). Consider applying StandardScaler or MinMaxScaler to prevent this feature from dominating other attributes in models like KNN, SVM, or Neural Networks.`,
          impact: "Medium",
        });
      }

      // low variance constant numeric
      if (stats.stdDev === 0) {
        features.push({
          column: name,
          type: "Drop Constant Column",
          title: `Drop constant column "${name}"`,
          description: `The standard deviation is 0 (all values are identical). Constant columns provide zero information to machine learning models and should be dropped.`,
          impact: "High",
        });
      }
    }

    // Categorical Heuristics
    if (col.info.type === "categorical" || col.info.type === "mixed") {
      // High cardinality or ID check
      if (col.info.uniqueCount === col.info.totalCount - col.info.nullCount && col.info.totalCount > 10) {
        features.push({
          column: name,
          type: "Drop Identifier",
          title: `Drop candidate identifier column "${name}"`,
          description: `All values in this column are unique. It is highly likely to be a row index, database ID, or UUID, which will cause overfitting and should be excluded from machine learning models.`,
          impact: "High",
        });
      } else if (col.info.uniqueCount > 25) {
        features.push({
          column: name,
          type: "Target Encoding",
          title: `Apply Target/Frequency Encoding to "${name}"`,
          description: `The column has high cardinality (${col.info.uniqueCount} unique values). One-hot encoding would explode the feature space. Consider using Target Encoding or Frequency Encoding instead.`,
          impact: "Medium",
        });
      } else if (col.info.uniqueCount >= 2 && col.info.uniqueCount <= 10) {
        features.push({
          column: name,
          type: "One-Hot Encoding",
          title: `Apply One-Hot Encoding to "${name}"`,
          description: `This categorical column has low cardinality (${col.info.uniqueCount} unique categories). One-hot encoding (or pd.get_dummies) is ideal to represent this in linear/neural net architectures.`,
          impact: "Medium",
        });
      }
    }

    // Datetime Heuristics
    if (col.info.type === "datetime") {
      features.push({
        column: name,
        type: "Datetime Extraction",
        title: `Extract cyclical temporal features from "${name}"`,
        description: `Extract structural components like year, month, day of week, day of year, and hour. If applicable, transform month and day of week into sine/cosine cyclical encoding to represent seasonal trends.`,
        impact: "High",
      });
    }
  }

  // Multicollinearity suggestion from correlation matrix
  if (correlation) {
    const n = correlation.labels.length;
    const handled = new Set<string>();
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const val = correlation.values[i][j];
        if (Math.abs(val) > 0.85) {
          const colA = correlation.labels[i];
          const colB = correlation.labels[j];
          const key = [colA, colB].sort().join("-");
          if (!handled.has(key)) {
            handled.add(key);
            features.push({
              column: colB,
              type: "Multicollinearity",
              title: `Resolve multicollinearity between "${colA}" and "${colB}"`,
              description: `These columns have an extremely high correlation (r = ${val.toFixed(2)}). Consider dropping one of them (e.g., "${colB}") or applying dimensionality reduction (PCA) to prevent unstable weights in linear models.`,
              impact: "Medium",
            });
          }
        }
      }
    }
  }

  // 5. Missing Value Recommendations
  const missingRecs: MissingValueRecommendation[] = [];

  for (const mCol of missing.columns) {
    if (mCol.missing === 0) continue;

    const colName = mCol.name;
    const colProfile = columns.find(c => c.info.name === colName);
    if (!colProfile) continue;

    let strategy = "";
    let recommendation = "";
    let codeSnippet = "";

    const pct = mCol.percentage;

    if (pct > 40) {
      strategy = "Missingness Indicator + Constant Fill";
      recommendation = `More than 40% of data is missing (${pct}%). Dropping could lose vital information, but imputing means/medians will bias variance. Create a binary indicator column representing whether the value was missing, then impute 0 or 'Unknown'.`;
      codeSnippet = `# Create binary indicator and impute constant
df['${colName}_isna'] = df['${colName}'].isna().astype(int)
df['${colName}'] = df['${colName}'].fillna(${colProfile.info.type === "numeric" ? "0" : "'Missing'"})`;
    } else if (colProfile.info.type === "numeric") {
      const isSkewed = colProfile.numericStats ? Math.abs(colProfile.numericStats.skewness) > 1 : false;
      if (isSkewed) {
        strategy = "Median Imputation";
        recommendation = `The column "${colName}" is skewed. The median is a more robust measure of central tendency than the mean as it is unaffected by extreme outliers.`;
        codeSnippet = `# Impute missing values with column median
median_val = df['${colName}'].median()
df['${colName}'] = df['${colName}'].fillna(median_val)`;
      } else {
        strategy = "Mean Imputation";
        recommendation = `The column "${colName}" follows a relatively normal distribution. Imputing the mean is suitable to fill gaps without altering the overall mean of the sample.`;
        codeSnippet = `# Impute missing values with column mean
mean_val = df['${colName}'].mean()
df['${colName}'] = df['${colName}'].fillna(mean_val)`;
      }
    } else {
      // Categorical / Boolean / Mixed
      strategy = "Mode (Most Frequent) Imputation";
      recommendation = `Categorical feature "${colName}" can be filled with the most common category (mode) or marked as a separate class. Use mode imputation to preserve class distribution if missingness is completely at random.`;
      codeSnippet = `# Impute missing values with column mode (most frequent)
mode_val = df['${colName}'].mode()[0]
df['${colName}'] = df['${colName}'].fillna(mode_val)`;
    }

    missingRecs.push({
      column: colName,
      missingCount: mCol.missing,
      percentage: mCol.percentage,
      recommendation,
      strategy,
      codeSnippet,
    });
  }

  // 6. Competition Insights
  const targetLeakageAlerts: CompetitionLeakage[] = [];
  
  if (targetCol) {
    // Search for correlations > 0.95 with the target
    if (correlation) {
      const targetIdx = correlation.labels.indexOf(targetCol);
      if (targetIdx !== -1) {
        correlation.labels.forEach((label, idx) => {
          if (label !== targetCol) {
            const corrVal = correlation.values[targetIdx][idx];
            if (Math.abs(corrVal) > 0.95) {
              targetLeakageAlerts.push({
                column: label,
                reason: `Extremely high correlation (r = ${corrVal.toFixed(2)}) with target "${targetCol}". This feature may be updated after the target event occurs (e.g. duplicate target representation or post-event logging), causing data leakage.`,
                severity: "High",
              });
            }
          }
        });
      }
    }

    // Name-based target leakage check (e.g., contains 'id' or is row count, and has a strong correlation with target)
    for (const col of columns) {
      if (col.info.name !== targetCol && /id|index|key/i.test(col.info.name)) {
        if (col.numericStats && correlation) {
          const colIdx = correlation.labels.indexOf(col.info.name);
          const targetIdx = correlation.labels.indexOf(targetCol);
          if (colIdx !== -1 && targetIdx !== -1) {
            const corrVal = Math.abs(correlation.values[targetIdx][colIdx]);
            if (corrVal > 0.7) {
              targetLeakageAlerts.push({
                column: col.info.name,
                reason: `Identifier column "${col.info.name}" shows high correlation with target (r = ${correlation.values[targetIdx][colIdx].toFixed(2)}). This indicates a split/chronological ordering artifact that causes leakage during model evaluation.`,
                severity: "Medium",
              });
            }
          }
        }
      }
    }
  }

  // Validation strategy
  let validationStrategy = "";
  let validationDetails = "";

  if (datetimeCount > 0) {
    validationStrategy = "Time-Based Split (Walk-forward / Temporal Validation)";
    validationDetails = "A datetime feature is present. To avoid lookahead bias and model training on 'future' data to predict the past, split train/test based on a threshold date rather than random folds. Recommend a 5-fold expanding window or a single time threshold split.";
  } else if (assumedTask === "Classification") {
    validationStrategy = "Stratified 5-Fold Cross-Validation";
    validationDetails = `For this classification task, standard random splits can cause class ratio drift between folds. Use Stratified K-Fold to ensure each fold has approximately the same percentage of samples of each target class.`;
  } else {
    validationStrategy = "5-Fold Cross-Validation";
    validationDetails = "A standard 5-Fold or 10-Fold cross-validation split will provide robust validation scores. Ensure you fit any scaling or encoders *within* each cross-validation fold to avoid validation leakage.";
  }

  // Model Recommendations
  const modelSuggestions: CompetitionModelSuggestion[] = [];
  if (assumedTask === "Classification") {
    modelSuggestions.push({
      model: "LightGBM / XGBoost Classifier",
      suitability: "High",
      reason: "Gradient boosted trees are the gold standard for tabular classification. They handle high-cardinality features, categorical splits natively (LightGBM), are scale-invariant, and automatically handle missing values.",
    });
    modelSuggestions.push({
      model: "CatBoost Classifier",
      suitability: "High",
      reason: "CatBoost handles categorical features outstandingly with target encoding heuristics and minimizes overfitting on small-to-mid size datasets.",
    });
    modelSuggestions.push({
      model: "Logistic Regression (with L1/L2 Regularization)",
      suitability: "Medium",
      reason: "Provides a reliable baseline. Regularization handles multicollinearity and helps identify feature importances via coefficients.",
    });
  } else {
    modelSuggestions.push({
      model: "XGBoost / LightGBM Regressor",
      suitability: "High",
      reason: "Excellent for non-linear regression problems on tabular datasets. Very fast execution, highly tunable hyperparameters, and robust to outliers in input features.",
    });
    modelSuggestions.push({
      model: "Random Forest Regressor",
      suitability: "Medium",
      reason: "Great baseline model that is highly resistant to overfitting and does not require extensive hyperparameter tuning to get reasonable results.",
    });
    modelSuggestions.push({
      model: "Ridge Regression / ElasticNet",
      suitability: "Medium",
      reason: "Good linear baseline. Useful to see if non-linear models actually add value. Requires input normalization/scaling.",
    });
  }

  // Metrics recommendations
  const metricSuggestions: string[] = [];
  if (assumedTask === "Classification") {
    // If target has 2 unique values
    const targetUnique = targetProfile?.info.uniqueCount ?? 2;
    if (targetUnique === 2) {
      metricSuggestions.push("ROC-AUC (Receiver Operating Characteristic - Area Under Curve)");
      metricSuggestions.push("F1-Score (for class imbalance)");
      metricSuggestions.push("Log Loss (cross-entropy probability evaluation)");
    } else {
      metricSuggestions.push("Multi-class Log Loss");
      metricSuggestions.push("Macro-averaged F1-Score");
      metricSuggestions.push("Quadratic Weighted Kappa (if target classes are ordered/ordinal)");
    }
  } else {
    metricSuggestions.push("RMSE (Root Mean Squared Error) - penalizes larger errors");
    metricSuggestions.push("MAE (Mean Absolute Error) - robust to extreme target outliers");
    metricSuggestions.push("R-squared (Coefficient of Determination) - variance explanation score");
  }

  const competition: CompetitionInsights = {
    targetColumnSuggestion: targetCol,
    targetLeakageAlerts,
    validationStrategy,
    validationDetails,
    modelSuggestions,
    metricSuggestions,
  };

  return {
    summary,
    features,
    missing: missingRecs,
    competition,
  };
}
