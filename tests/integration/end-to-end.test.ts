import { Analyzer } from '../../src/core/analyzer';
import { Generator } from '../../src/core/generator';
import { AIClient } from '../../src/ai/client';
import { createPrompt } from '../../src/ai/prompt';
import { parseResponse } from '../../src/ai/response-parser';

describe('End-to-End Tests for AI Test Generator', () => {
    let analyzer: Analyzer;
    let generator: Generator;
    let aiClient: AIClient;

    beforeAll(() => {
        analyzer = new Analyzer();
        generator = new Generator();
        aiClient = new AIClient();
    });

    test('should analyze code and generate test cases', async () => {
        const codeSample = `function add(a, b) { return a + b; }`;
        const analysisResults = analyzer.analyzeCode(codeSample);
        const prompt = createPrompt(analysisResults);
        const aiResponse = await aiClient.sendRequest(prompt);
        const parsedResponse = parseResponse(aiResponse);
        const testCases = generator.generateTestCases(parsedResponse);

        expect(testCases).toBeDefined();
        expect(testCases.length).toBeGreaterThan(0);
    });

    test('should handle errors gracefully', async () => {
        const invalidCodeSample = `function add(a, b) { return a +; }`;
        const analysisResults = analyzer.analyzeCode(invalidCodeSample);
        const prompt = createPrompt(analysisResults);
        const aiResponse = await aiClient.sendRequest(prompt);
        const parsedResponse = parseResponse(aiResponse);
        const testCases = generator.generateTestCases(parsedResponse);

        expect(testCases).toBeDefined();
        expect(testCases.length).toBe(0);
    });
});