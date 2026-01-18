const fs = require('fs');
const path = require('path');

/**
 * Merge multiple Playwright test result JSON files from different shards
 * Usage: node merger-report.js <input-directory> <output-file>
 * Example: node merger-report.js ./test-results ./merged-results.json
 */

class PlaywrightReportMerger {
  constructor() {
    this.mergedReport = null;
  }

  /**
   * Read all JSON files from a directory
   */
  readJsonFiles(directory) {
    const files = fs.readdirSync(directory);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`Found ${jsonFiles.length} JSON files in ${directory}`);
    
    return jsonFiles.map(file => {
      const filePath = path.join(directory, file);
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    });
  }

  /**
   * Merge test suites from multiple reports
   */
  mergeSuites(reports) {
    const suiteMap = new Map();

    reports.forEach(report => {
      if (!report.suites) return;

      report.suites.forEach(suite => {
        const suiteKey = suite.file;
        
        if (!suiteMap.has(suiteKey)) {
          suiteMap.set(suiteKey, JSON.parse(JSON.stringify(suite)));
        } else {
          const existingSuite = suiteMap.get(suiteKey);
          this.mergeNestedSuites(existingSuite, suite);
        }
      });
    });

    return Array.from(suiteMap.values());
  }

  /**
   * Recursively merge nested suites
   */
  mergeNestedSuites(target, source) {
    if (source.suites && source.suites.length > 0) {
      if (!target.suites) target.suites = [];
      
      source.suites.forEach(sourceSuite => {
        const existingIndex = target.suites.findIndex(
          ts => ts.title === sourceSuite.title && ts.file === sourceSuite.file
        );

        if (existingIndex === -1) {
          target.suites.push(JSON.parse(JSON.stringify(sourceSuite)));
        } else {
          this.mergeNestedSuites(target.suites[existingIndex], sourceSuite);
          this.mergeSpecs(target.suites[existingIndex], sourceSuite);
        }
      });
    }
  }

  /**
   * Merge specs within a suite
   */
  mergeSpecs(target, source) {
    if (source.specs && source.specs.length > 0) {
      if (!target.specs) target.specs = [];

      source.specs.forEach(sourceSpec => {
        const existingIndex = target.specs.findIndex(
          ts => ts.title === sourceSpec.title && ts.file === sourceSpec.file && ts.line === sourceSpec.line
        );

        if (existingIndex === -1) {
          target.specs.push(JSON.parse(JSON.stringify(sourceSpec)));
        } else {
          // Merge tests within the spec
          if (sourceSpec.tests && sourceSpec.tests.length > 0) {
            if (!target.specs[existingIndex].tests) {
              target.specs[existingIndex].tests = [];
            }
            target.specs[existingIndex].tests.push(...sourceSpec.tests);
          }
        }
      });
    }
  }

  /**
   * Merge statistics from multiple reports
   */
  mergeStats(reports) {
    const stats = {
      startTime: null,
      duration: 0,
      expected: 0,
      skipped: 0,
      unexpected: 0,
      flaky: 0
    };

    reports.forEach(report => {
      if (!report.stats) return;

      // Get the earliest start time
      if (!stats.startTime || new Date(report.stats.startTime) < new Date(stats.startTime)) {
        stats.startTime = report.stats.startTime;
      }

      // Sum up durations and counts
      stats.duration += report.stats.duration || 0;
      stats.expected += report.stats.expected || 0;
      stats.skipped += report.stats.skipped || 0;
      stats.unexpected += report.stats.unexpected || 0;
      stats.flaky += report.stats.flaky || 0;
    });

    return stats;
  }

  /**
   * Merge errors from multiple reports
   */
  mergeErrors(reports) {
    const errors = [];
    
    reports.forEach(report => {
      if (report.errors && report.errors.length > 0) {
        errors.push(...report.errors);
      }
    });

    return errors;
  }

  /**
   * Update config with merged shard information
   */
  updateConfig(baseConfig, reports) {
    const config = JSON.parse(JSON.stringify(baseConfig));
    
    // Remove or update shard info
    if (config.shard) {
      delete config.shard; // Remove shard info in merged report
    }

    // Update actualWorkers to sum of all shards
    if (config.metadata) {
      const totalWorkers = reports.reduce((sum, report) => {
        return sum + (report.config?.metadata?.actualWorkers || 0);
      }, 0);
      config.metadata.actualWorkers = totalWorkers;
    }

    return config;
  }

  /**
   * Main merge function
   */
  merge(reports) {
    if (!reports || reports.length === 0) {
      throw new Error('No reports to merge');
    }

    console.log(`Merging ${reports.length} reports...`);

    // Use the first report as the base
    const baseReport = reports[0];

    this.mergedReport = {
      config: this.updateConfig(baseReport.config, reports),
      suites: this.mergeSuites(reports),
      errors: this.mergeErrors(reports),
      stats: this.mergeStats(reports)
    };

    console.log('Merge completed successfully');
    console.log(`Total tests: ${this.mergedReport.stats.expected}`);
    console.log(`Passed: ${this.mergedReport.stats.expected - this.mergedReport.stats.unexpected}`);
    console.log(`Failed: ${this.mergedReport.stats.unexpected}`);
    console.log(`Skipped: ${this.mergedReport.stats.skipped}`);
    console.log(`Flaky: ${this.mergedReport.stats.flaky}`);

    return this.mergedReport;
  }

  /**
   * Write merged report to file
   */
  writeReport(outputPath) {
    if (!this.mergedReport) {
      throw new Error('No merged report available. Run merge() first.');
    }

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      outputPath,
      JSON.stringify(this.mergedReport, null, 2),
      'utf8'
    );

    console.log(`Merged report written to: ${outputPath}`);
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node merger-report.js <input-directory> <output-file>');
    console.error('Example: node merger-report.js ./test-results ./merged-results.json');
    process.exit(1);
  }

  const inputDirectory = args[0];
  const outputFile = args[1];

  if (!fs.existsSync(inputDirectory)) {
    console.error(`Error: Directory '${inputDirectory}' does not exist`);
    process.exit(1);
  }

  try {
    const merger = new PlaywrightReportMerger();
    const reports = merger.readJsonFiles(inputDirectory);

    if (reports.length === 0) {
      console.error('Error: No JSON files found in the directory');
      process.exit(1);
    }

    merger.merge(reports);
    merger.writeReport(outputFile);

    console.log('\n✓ Successfully merged all test reports!');
  } catch (error) {
    console.error('Error during merge:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = PlaywrightReportMerger;