import { Analyzer } from '../core/analyzer';

describe('shouldHaveTest', () => {
    let analyzer: Analyzer;

    beforeEach(() => {
        analyzer = new Analyzer();
    });

    it('should return true for functions', () => {
        const component = { type: 'function', complexity: 1, code: 'function test() {}' };
        expect(analyzer.shouldHaveTest(component)).toBe(true);
    });

    it('should return true for classes', () => {
        const component = { type: 'class', complexity: 1, code: 'class Test {}' };
        expect(analyzer.shouldHaveTest(component)).toBe(true);
    });

    it('should return true for complex methods', () => {
        const component = { type: 'method', complexity: 3, code: 'function test() {}' };
        expect(analyzer.shouldHaveTest(component)).toBe(true);
    });

    it('should return false for simple methods', () => {
        const component = { type: 'method', complexity: 1, code: 'function test() {}' };
        expect(analyzer.shouldHaveTest(component)).toBe(false);
    });

    it('should return true for methods with more than 15 lines of code', () => {
        const component = { type: 'method', complexity: 1, code: 'function test() {\n//many lines\n//many lines\n//many lines\n//many lines\n//many lines\n//many lines\n//many lines\n//many lines\n//many lines\n//many lines\n//many lines\n//many lines\n//many lines\n//many lines\n//many lines\n}' };
        expect(analyzer.shouldHaveTest(component)).toBe(true);
    });

    it('should return false for methods with less than 15 lines of code', () => {
        const component = { type: 'method', complexity: 1, code: 'function test() {\n//few lines\n}' };
        expect(analyzer.shouldHaveTest(component)).toBe(false);
    });

    it('should return false for other component types', () => {
        const component = { type: 'variable', complexity: 1, code: 'let x = 1;' };
        expect(analyzer.shouldHaveTest(component)).toBe(false);
    });

    it('should handle undefined code property', () => {
        const component = { type: 'method', complexity: 3 } as any;
        expect(analyzer.shouldHaveTest(component)).toBe(false);
    });

    it('should handle empty code property', () => {
        const component = { type: 'method', complexity: 3, code: '' };
        expect(analyzer.shouldHaveTest(component)).toBe(false);
    });

    it('should handle null code property', () => {
        const component = { type: 'method', complexity: 3, code: null } as any;
        expect(analyzer.shouldHaveTest(component)).toBe(false);
    });

    it('should handle component with type as string', () => {
        const component = { type: 'method' as any, complexity: 3, code: 'function test() {}' };
        expect(analyzer.shouldHaveTest(component)).toBe(true);
    });

});

