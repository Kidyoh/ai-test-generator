#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import Analyzer, { AnalysisResult, Component } from './core/analyzer';
import Generator, { GeneratorOptions, GeneratedTest } from './core/generator';
import { AIClient, AIClientOptions } from './ai/client';

interface TestGeneratorOptions extends GeneratorOptions {
  codebasePath?: string;
  excludePaths?: string[];
  includePatterns?: string[];
  testThreshold?: number;
  dryRun?: boolean;
  verbose?: boolean;
  singleFile?: string;
  strictQuotaMode?: boolean;
  offlineMode?: boolean;
}

class AITestGenerator {
  private analyzer: Analyzer;
  private generator: Generator;
  private options: TestGeneratorOptions;
  
  constructor(options: TestGeneratorOptions = {
      testFramework: 'jest'
  }) {
    this.options = {
      ...options,
      testFramework: options.testFramework || 'jest',
      outputDir: options.outputDir || './tests',
      testStyle: options.testStyle || 'unit',
      dryRun: options.dryRun ?? false,
      verbose: options.verbose ?? false,
      interactive: options.interactive ?? true
    };
    
    this.analyzer = new Analyzer();
    this.generator = new Generator(this.options);
  }
  
  /**
   * Generate tests for an entire codebase
   * @param codebasePath Path to the root directory of the codebase
   * @returns This instance, for chaining
   */
  async generateForCodebase(codebasePath: string = this.options.codebasePath || process.cwd()): Promise<AITestGenerator> {
    try {
      this.log(`Analyzing codebase at: ${codebasePath}`);
      
      // Analyze the codebase
      await this.analyzer.analyzeCodebase(codebasePath, {
        excludePaths: this.options.excludePaths,
        includePatterns: this.options.includePatterns,
        testThreshold: this.options.testThreshold
      });
      
      const results = this.analyzer.getAnalysisResults();
      this.log(`Found ${this.countComponentsNeedingTests(results)} components that need tests`);
      
      // Generate and save tests
      return this.generateFromAnalysis(results);
    } catch (error) {
      console.error('Error generating tests for codebase:', error);
      return this;
    }
  }
  
  /**
   * Generate tests for a single file
   * @param filePath Path to the file to generate tests for
   * @returns This instance, for chaining
   */
  async generateForFile(filePath: string): Promise<AITestGenerator> {
    try {
      this.log(`Analyzing file: ${filePath}`);
      
      // Analyze the file
      await this.analyzer.analyzeFile(filePath);
      
      const results = this.analyzer.getAnalysisResults();
      this.log(`Found ${this.countComponentsNeedingTests(results)} components that need tests`);
      
      // Generate and save tests
      return this.generateFromAnalysis(results);
    } catch (error) {
      console.error('Error generating tests for file:', error);
      return this;
    }
  }
  
  /**
   * Generate tests from analysis results
   * @param results Analysis results from the analyzer
   * @returns This instance, for chaining
   */
  async generateFromAnalysis(results: AnalysisResult[]): Promise<AITestGenerator> {
    // Generate tests for components that need them
    const generatedTests = await this.generator.generateTests(results);
    
    this.log(`Generated ${generatedTests.length} test files`);
    
    if (!this.options.dryRun && generatedTests.length > 0) {
      await this.generator.saveTests(generatedTests);
    } else if (this.options.dryRun) {
      this.log('Dry run - not saving tests');
      this.logGeneratedTests(generatedTests);
    }
    
    return this;
  }
  
  /**
   * Count components that need tests in analysis results
   * @param results Analysis results
   * @returns Count of components needing tests
   */
  private countComponentsNeedingTests(results: AnalysisResult[]): number {
    return results.reduce((count, result) => {
      return count + result.components.filter(c => c.needsTest).length;
    }, 0);
  }
  
  /**
   * Log information if verbose mode is enabled
   * @param message Message to log
   */
  private log(message: string): void {
    if (this.options.verbose) {
      console.log(`[AI-Test-Generator] ${message}`);
    }
  }
  
  /**
   * Log information about generated tests in dry run mode
   * @param tests Generated test files
   */
  private logGeneratedTests(tests: GeneratedTest[]): void {
    if (this.options.dryRun && this.options.verbose) {
      console.log('\n--- Generated Test Files (Dry Run) ---');
      tests.forEach(test => {
        console.log(`\nTest for ${test.component.name} (${test.component.type})`);
        console.log(`File: ${test.filePath}`);
        console.log('Preview:');
        console.log(test.content.split('\n').slice(0, 5).join('\n') + '...');
      });
    }
  }
}

// Export default instance and main classes
export default AITestGenerator;
export { AITestGenerator, Analyzer, Generator, AIClient };
export type { AnalysisResult, Component, GeneratorOptions, GeneratedTest, AIClientOptions, TestGeneratorOptions };

// CLI support for direct usage via npx/npm run
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: TestGeneratorOptions = {
    verbose: true,
    testFramework: 'jest' // Add this required property
  };
  
  // Simple CLI argument parsing
  let codebasePath = process.cwd();
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--path' && i + 1 < args.length) {
      codebasePath = args[++i];
    } else if (args[i] === '--framework' && i + 1 < args.length) {
      options.testFramework = args[++i] as any;
    } else if (args[i] === '--output' && i + 1 < args.length) {
      options.outputDir = args[++i];
    } else if (args[i] === '--dry-run') {
      options.dryRun = true;
    } else if (args[i] === '--file' && i + 1 < args.length) {
      options.singleFile = args[++i];
    } else if (args[i] === '--api-key' && i + 1 < args.length) {
      options.apiKey = args[++i];
    } else if (args[i] === '--model' && i + 1 < args.length) {
      options.aiModel = args[++i];
    } else if (args[i] === '--gemini') {
      // Default to Gemini model if --gemini flag is used
      options.aiModel = 'gemini-1.5-flash';
    } else if (args[i] === '--non-interactive') {
      options.interactive = false;
    } else if (args[i] === '--request-delay' && i + 1 < args.length) {
      options.requestDelay = parseInt(args[++i], 10);
    } else if (args[i] === '--batch-size' && i + 1 < args.length) {
      options.batchSize = parseInt(args[++i], 10);
    } else if (args[i] === '--batch-delay' && i + 1 < args.length) {
      options.batchDelay = parseInt(args[++i], 10);
    } else if (args[i] === '--quota-friendly') {
      // Preset for quota-friendly operation (large delays between requests)
      options.requestDelay = 5000; // 5 seconds between requests
      options.batchSize = 3;       // Only 3 requests per batch
      options.batchDelay = 30000;  // 30 seconds between batches
    } else if (args[i] === '--ultra-quota-friendly') {
      options.strictQuotaMode = true;
      options.requestDelay = 45000; // 45 seconds between requests
      options.aiModel = 'gemini-1.5-flash'; // Use the smaller model
      console.log('📢 Ultra-quota-friendly mode enabled. This will be very slow but should avoid quota errors.');
    } else if (args[i] === '--offline') {
      options.offlineMode = true;
      console.log('📴 Offline mode enabled. Simple test templates will be generated without API calls.');
    }
  }
  
  // Run the test generator
  const generator = new AITestGenerator(options);
  
  (async () => {
    try {
      if (options.singleFile) {
        await generator.generateForFile(options.singleFile);
      } else {
        await generator.generateForCodebase(codebasePath);
      }
    } catch (error) {
      console.error('Error running AI Test Generator:', error);
      process.exit(1);
    }
  })();
}