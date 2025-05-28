import { Component, AnalysisResult } from './analyzer';
interface GeneratorOptions {
    testFramework: 'jest' | 'mocha' | 'vitest';
    outputDir?: string;
    apiKey?: string;
    aiModel?: string;
    testStyle?: 'unit' | 'integration' | 'both';
    coverage?: number;
    includeSnapshot?: boolean;
    timeout?: number;
    interactive?: boolean;
}
interface GeneratedTest {
    filePath: string;
    content: string;
    component: Component;
}
declare class Generator {
    private options;
    private aiClient;
    constructor(options: GeneratorOptions);
    /**
     * Generate tests for all components that need tests from analysis results
     * @param analysisResults Results from the code analyzer
     * @returns Array of generated test files
     */
    generateTests(analysisResults: AnalysisResult[]): Promise<GeneratedTest[]>;
    /**
     * Generate a test for a single component
     * @param component The component to generate a test for
     * @param sourceFilePath Path to the source file containing the component
     * @returns Generated test file
     */
    generateTestForComponent(component: Component, sourceFilePath: string): Promise<GeneratedTest | null>;
    /**
     * Save generated tests to the file system
     * @param generatedTests Array of generated test data
     */
    saveTests(generatedTests: GeneratedTest[]): Promise<void>;
    /**
     * Get the appropriate file path for the generated test
     * @param sourceFilePath Original source file path
     * @param componentName Name of the component being tested
     * @returns Path for the generated test file
     */
    private getTestFilePath;
}
export default Generator;
export { GeneratorOptions, GeneratedTest };
