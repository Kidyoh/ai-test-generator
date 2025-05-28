"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const glob = __importStar(require("glob"));
const javascript_1 = require("../parsers/javascript");
const typescript_1 = require("../parsers/typescript");
class Analyzer {
    constructor() {
        this.analysisResults = [];
        this.jsParser = new javascript_1.JavaScriptParser();
        this.tsParser = new typescript_1.TypeScriptParser();
    }
    /**
     * Analyzes the entire codebase based on the provided directory path
     * @param codebasePath Path to the codebase to analyze
     * @param options Configuration options for analysis
     * @returns The analyzer instance for chaining
     */
    async analyzeCodebase(codebasePath, options = {}) {
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
    async analyzeFile(filePath) {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const fileExtension = path.extname(filePath);
            let components = [];
            if (['.js', '.jsx'].includes(fileExtension)) {
                components = await this.jsParser.parse(fileContent, filePath);
            }
            else if (['.ts', '.tsx'].includes(fileExtension)) {
                components = await this.tsParser.parse(fileContent, filePath);
            }
            else {
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
        }
        catch (error) {
            console.error(`Error analyzing file ${filePath}:`, error);
        }
    }
    /**
     * Finds all files to analyze based on the provided options
     */
    findFilesToAnalyze(codebasePath, options) {
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
        let allFiles = [];
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
    shouldHaveTest(component) {
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
    getAnalysisResults() {
        return this.analysisResults;
    }
}
exports.default = Analyzer;
