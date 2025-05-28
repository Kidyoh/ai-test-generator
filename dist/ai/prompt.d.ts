import { Component } from '../core/analyzer';
interface PromptOptions {
    component: Component;
    sourceFilePath: string;
    testFramework: 'jest' | 'mocha' | 'vitest';
    testStyle: 'unit' | 'integration' | 'both';
    coverage?: number;
    includeSnapshot?: boolean;
}
/**
 * Create a prompt for the AI to generate test code
 * @param options Options for the prompt
 * @returns Formatted prompt string
 */
export declare function createPrompt(options: PromptOptions): string;
export {};
