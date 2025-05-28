import * as fs from 'fs';
import * as path from 'path';
import { Component, AnalysisResult } from './analyzer';
import { AIClient } from '../ai/client';
import { createPrompt } from '../ai/prompt';
import { parseResponse } from '../ai/parser';

interface GeneratorOptions {
  testFramework: 'jest' | 'mocha' | 'vitest';
  outputDir?: string;
  apiKey?: string;
  aiModel?: string;
  testStyle?: 'unit' | 'integration' | 'both';
  coverage?: number; // Minimum coverage percentage to aim for
  includeSnapshot?: boolean;
  timeout?: number; // Timeout for AI request in ms
  interactive?: boolean; // Whether to prompt for API key if not provided
}

interface GeneratedTest {
  filePath: string;
  content: string;
  component: Component;
}

class Generator {
  private options: GeneratorOptions;
  private aiClient: AIClient;
  
  constructor(options: GeneratorOptions) {
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
    
    this.aiClient = new AIClient({
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
  async generateTests(analysisResults: AnalysisResult[]): Promise<GeneratedTest[]> {
    const generatedTests: GeneratedTest[] = [];
    
    for (const result of analysisResults) {
      // Filter components that need tests
      const componentsToTest = result.components.filter(component => component.needsTest);
      
      for (const component of componentsToTest) {
        try {
          const test = await this.generateTestForComponent(component, result.filePath);
          if (test) {
            generatedTests.push(test);
          }
        } catch (error) {
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
  async generateTestForComponent(
    component: Component, 
    sourceFilePath: string
  ): Promise<GeneratedTest | null> {
    try {
      // Create a prompt for the AI
      const prompt = createPrompt({
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
      const testContent = parseResponse(aiResponse);
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
    } catch (error) {
      console.error(`Error generating test for ${component.name}:`, error);
      return null;
    }
  }
  
  /**
   * Save generated tests to the file system
   * @param generatedTests Array of generated test data
   */
  async saveTests(generatedTests: GeneratedTest[]): Promise<void> {
    for (const test of generatedTests) {
      try {
        // Ensure the directory exists
        const directory = path.dirname(test.filePath);
        await fs.promises.mkdir(directory, { recursive: true });
        
        // Write the test file
        await fs.promises.writeFile(test.filePath, test.content, 'utf8');
        console.log(`✅ Test saved: ${test.filePath}`);
      } catch (error) {
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
  private getTestFilePath(sourceFilePath: string, componentName: string): string {
    const parsedPath = path.parse(sourceFilePath);
    const relativePath = parsedPath.dir.replace(process.cwd(), '');
    const outputDir = this.options.outputDir || './tests';
    
    // Create test file name based on source file
    let testFileName = '';
    
    if (this.options.testFramework === 'jest') {
      testFileName = `${parsedPath.name}.test${parsedPath.ext}`;
    } else if (this.options.testFramework === 'mocha') {
      testFileName = `${parsedPath.name}.spec${parsedPath.ext}`;
    } else {
      testFileName = `${parsedPath.name}.test${parsedPath.ext}`;
    }
    
    return path.join(process.cwd(), outputDir, relativePath, testFileName);
  }
}

export default Generator;
export { GeneratorOptions, GeneratedTest };