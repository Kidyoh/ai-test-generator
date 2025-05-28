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
const client_1 = require("../ai/client");
const prompt_1 = require("../ai/prompt");
const parser_1 = require("../ai/parser");
class Generator {
    constructor(options) {
        // Fix the spread operator issue by spreading first, then providing defaults for missing properties
        this.options = {
            ...options,
            testFramework: options.testFramework || 'jest',
            outputDir: options.outputDir || './tests',
            testStyle: options.testStyle || 'unit',
            coverage: options.coverage ?? 80,
            includeSnapshot: options.includeSnapshot ?? false,
            timeout: options.timeout || 30000
        };
        this.aiClient = new client_1.AIClient({
            apiKey: this.options.apiKey,
            model: this.options.aiModel,
            timeout: this.options.timeout
        });
    }
    /**
     * Generate tests for all components that need tests from analysis results
     * @param analysisResults Results from the code analyzer
     * @returns Array of generated test files
     */
    async generateTests(analysisResults) {
        const generatedTests = [];
        for (const result of analysisResults) {
            // Filter components that need tests
            const componentsToTest = result.components.filter(component => component.needsTest);
            for (const component of componentsToTest) {
                try {
                    const test = await this.generateTestForComponent(component, result.filePath);
                    if (test) {
                        generatedTests.push(test);
                    }
                }
                catch (error) {
                    console.error(`Error generating test for ${component.name}:`, error);
                }
            }
        }
        return generatedTests;
    }
    /**
     * Generate a test for a single component
     * @param component The component to generate a test for
     * @param sourceFilePath Path to the source file containing the component
     * @returns Generated test file
     */
    async generateTestForComponent(component, sourceFilePath) {
        try {
            // Create a prompt for the AI
            const prompt = (0, prompt_1.createPrompt)({
                component,
                sourceFilePath,
                testFramework: this.options.testFramework,
                testStyle: this.options.testStyle || 'unit',
                coverage: this.options.coverage,
                includeSnapshot: this.options.includeSnapshot
            });
            // Get AI response
            const aiResponse = await this.aiClient.complete(prompt);
            // Parse the response to extract just the code
            const testContent = (0, parser_1.parseResponse)(aiResponse);
            if (!testContent) {
                console.warn(`Failed to generate test for ${component.name}: Empty response`);
                return null;
            }
            // Determine output file path
            const testFilePath = this.getTestFilePath(sourceFilePath, component.name);
            return {
                filePath: testFilePath,
                content: testContent,
                component
            };
        }
        catch (error) {
            console.error(`Error generating test for ${component.name}:`, error);
            return null;
        }
    }
    /**
     * Save generated tests to the file system
     * @param generatedTests Array of generated test data
     */
    async saveTests(generatedTests) {
        for (const test of generatedTests) {
            try {
                // Ensure the directory exists
                const directory = path.dirname(test.filePath);
                await fs.promises.mkdir(directory, { recursive: true });
                // Write the test file
                await fs.promises.writeFile(test.filePath, test.content, 'utf8');
                console.log(`✅ Test saved: ${test.filePath}`);
            }
            catch (error) {
                console.error(`Error saving test ${test.filePath}:`, error);
            }
        }
    }
    /**
     * Get the appropriate file path for the generated test
     * @param sourceFilePath Original source file path
     * @param componentName Name of the component being tested
     * @returns Path for the generated test file
     */
    getTestFilePath(sourceFilePath, componentName) {
        const parsedPath = path.parse(sourceFilePath);
        const relativePath = parsedPath.dir.replace(process.cwd(), '');
        const outputDir = this.options.outputDir || './tests';
        // Create test file name based on source file
        let testFileName = '';
        if (this.options.testFramework === 'jest') {
            testFileName = `${parsedPath.name}.test${parsedPath.ext}`;
        }
        else if (this.options.testFramework === 'mocha') {
            testFileName = `${parsedPath.name}.spec${parsedPath.ext}`;
        }
        else {
            testFileName = `${parsedPath.name}.test${parsedPath.ext}`;
        }
        return path.join(process.cwd(), outputDir, relativePath, testFileName);
    }
}
exports.default = Generator;
