import { Analyzer } from '../../src/core/analyzer';

describe('Analyzer', () => {
    let analyzer: Analyzer;

    beforeEach(() => {
        analyzer = new Analyzer();
    });

    test('should analyze code and identify components requiring tests', () => {
        const code = `
            function add(a, b) {
                return a + b;
            }
        `;
        analyzer.analyzeCode(code);
        const results = analyzer.getAnalysisResults();
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(expect.objectContaining({
            component: 'add',
            requiresTest: true,
        }));
    });

    test('should return empty results for code without components', () => {
        const code = `// No components here`;
        analyzer.analyzeCode(code);
        const results = analyzer.getAnalysisResults();
        expect(results).toHaveLength(0);
    });

    test('should handle empty code input gracefully', () => {
        const code = '';
        analyzer.analyzeCode(code);
        const results = analyzer.getAnalysisResults();
        expect(results).toHaveLength(0);
    });
});