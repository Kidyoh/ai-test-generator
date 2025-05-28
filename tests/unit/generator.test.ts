import { Generator } from '../../src/core/generator';
import { Analyzer } from '../../src/core/analyzer';

describe('Generator', () => {
    let generator: Generator;
    let analyzer: Analyzer;

    beforeEach(() => {
        generator = new Generator();
        analyzer = new Analyzer();
    });

    it('should generate test cases for analyzed components', () => {
        const analysisResults = analyzer.analyzeCode('function testFunction() {}');
        const testCases = generator.generateTestCases(analysisResults);
        
        expect(testCases).toBeDefined();
        expect(testCases.length).toBeGreaterThan(0);
    });

    it('should format test cases correctly', () => {
        const testCase = {
            name: 'testFunction',
            input: 'input data',
            expected: 'expected output'
        };
        const formattedTestCase = generator.formatTestCase(testCase);
        
        expect(formattedTestCase).toContain('test("testFunction", () => {');
        expect(formattedTestCase).toContain('expect(result).toEqual(expected output);');
    });
});