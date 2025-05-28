import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { JavaScriptParser } from '../parsers/javascript';
import { TypeScriptParser } from '../parsers/typescript';

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

class Analyzer {
    private analysisResults: AnalysisResult[];
    private jsParser: JavaScriptParser;
    private tsParser: TypeScriptParser;

    constructor() {
        this.analysisResults = [];
        this.jsParser = new JavaScriptParser();
        this.tsParser = new TypeScriptParser();
    }

    /**
     * Analyzes the entire codebase based on the provided directory path
     * @param codebasePath Path to the codebase to analyze
     * @param options Configuration options for analysis
     * @returns The analyzer instance for chaining
     */
    async analyzeCodebase(codebasePath: string, options: { 
        excludePaths?: string[], 
        includePatterns?: string[],
        testThreshold?: number 
    } = {}): Promise<Analyzer> {
        const files = this.findFilesToAnalyze(codebasePath, options);
        
        for (const file of files) {
            await this.analyzeFile(file);
        }
        
        return this;
    }

    /**
     * Analyzes a single file
     * @param filePath Path to the file to analyze
     */
    async analyzeFile(filePath: string): Promise<void> {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const fileExtension = path.extname(filePath);
            
            let components: Component[] = [];
            
            if (['.js', '.jsx'].includes(fileExtension)) {
                components = await this.jsParser.parse(fileContent, filePath);
            } else if (['.ts', '.tsx'].includes(fileExtension)) {
                components = await this.tsParser.parse(fileContent, filePath);
            } else {
                // Unsupported file type, skip
                return;
            }
            
            // Filter components that need tests based on complexity or other factors
            const componentsNeedingTests = components.map(component => {
                return {
                    ...component,
                    needsTest: this.shouldHaveTest(component)
                };
            });
            
            this.analysisResults.push({
                filePath,
                fileType: fileExtension.substring(1), // Remove the dot
                components: componentsNeedingTests
            });
        } catch (error) {
            console.error(`Error analyzing file ${filePath}:`, error);
        }
    }

    /**
     * Finds all files to analyze based on the provided options
     */
    private findFilesToAnalyze(codebasePath: string, options: { 
        excludePaths?: string[], 
        includePatterns?: string[] 
    }): string[] {
        const defaultIncludePatterns = ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'];
        const includePatterns = options.includePatterns || defaultIncludePatterns;
        const excludePaths = [
            ...(options.excludePaths || []),
            '**/node_modules/**',
            '**/*.test.js', '**/*.spec.js',
            '**/*.test.ts', '**/*.spec.ts',
            '**/*.test.jsx', '**/*.spec.jsx',
            '**/*.test.tsx', '**/*.spec.tsx'
        ];
        
        let allFiles: string[] = [];
        
        for (const pattern of includePatterns) {
            const files = glob.sync(pattern, { 
                cwd: codebasePath,
                absolute: true,
                ignore: excludePaths
            });
            allFiles = [...allFiles, ...files];
        }
        
        return allFiles;
    }

    /**
     * Determines if a component should have a test based on its complexity and type
     */
    private shouldHaveTest(component: Component): boolean {
        // Simple heuristic: Functions, classes, and complex methods should have tests
        if (['function', 'class'].includes(component.type)) {
            return true;
        }
        
        if (component.type === 'method' && component.complexity > 2) {
            return true;
        }
        
        // Count lines of code as a simple complexity metric
        const linesOfCode = component.code.split('\n').length;
        if (linesOfCode > 15) {
            return true;
        }
        
        return false;
    }

    /**
     * Returns the analysis results
     */
    getAnalysisResults(): AnalysisResult[] {
        return this.analysisResults;
    }
}

export default Analyzer;
export { AnalysisResult, Component };