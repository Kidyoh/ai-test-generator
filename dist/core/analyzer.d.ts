interface AnalysisResult {
    filePath: string;
    fileType: string;
    components: Component[];
}
interface Component {
    name: string;
    type: 'function' | 'class' | 'method' | 'interface' | 'other';
    startLine: number;
    endLine: number;
    code: string;
    needsTest: boolean;
    complexity: number;
}
declare class Analyzer {
    private analysisResults;
    private jsParser;
    private tsParser;
    constructor();
    /**
     * Analyzes the entire codebase based on the provided directory path
     * @param codebasePath Path to the codebase to analyze
     * @param options Configuration options for analysis
     * @returns The analyzer instance for chaining
     */
    analyzeCodebase(codebasePath: string, options?: {
        excludePaths?: string[];
        includePatterns?: string[];
        testThreshold?: number;
    }): Promise<Analyzer>;
    /**
     * Analyzes a single file
     * @param filePath Path to the file to analyze
     */
    analyzeFile(filePath: string): Promise<void>;
    /**
     * Finds all files to analyze based on the provided options
     */
    private findFilesToAnalyze;
    /**
     * Determines if a component should have a test based on its complexity and type
     */
    private shouldHaveTest;
    /**
     * Returns the analysis results
     */
    getAnalysisResults(): AnalysisResult[];
}
export default Analyzer;
export { AnalysisResult, Component };
