#!/usr/bin/env node
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
}
declare class AITestGenerator {
    private analyzer;
    private generator;
    private options;
    constructor(options?: TestGeneratorOptions);
    /**
     * Generate tests for an entire codebase
     * @param codebasePath Path to the root directory of the codebase
     * @returns This instance, for chaining
     */
    generateForCodebase(codebasePath?: string): Promise<AITestGenerator>;
    /**
     * Generate tests for a single file
     * @param filePath Path to the file to generate tests for
     * @returns This instance, for chaining
     */
    generateForFile(filePath: string): Promise<AITestGenerator>;
    /**
     * Generate tests from analysis results
     * @param results Analysis results from the analyzer
     * @returns This instance, for chaining
     */
    generateFromAnalysis(results: AnalysisResult[]): Promise<AITestGenerator>;
    /**
     * Count components that need tests in analysis results
     * @param results Analysis results
     * @returns Count of components needing tests
     */
    private countComponentsNeedingTests;
    /**
     * Log information if verbose mode is enabled
     * @param message Message to log
     */
    private log;
    /**
     * Log information about generated tests in dry run mode
     * @param tests Generated test files
     */
    private logGeneratedTests;
}
export default AITestGenerator;
export { AITestGenerator, Analyzer, Generator, AIClient };
export type { AnalysisResult, Component, GeneratorOptions, GeneratedTest, AIClientOptions, TestGeneratorOptions };
