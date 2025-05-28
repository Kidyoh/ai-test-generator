import { parseFunction, parseClass } from '../../src/parsers/javascript';
import { parseFunction as parseTSFunction, parseClass as parseTSClass } from '../../src/parsers/typescript';

describe('JavaScript Parser', () => {
    test('should correctly parse a function', () => {
        const code = 'function testFunc() { return true; }';
        const result = parseFunction(code);
        expect(result).toEqual({
            name: 'testFunc',
            parameters: [],
            body: 'return true;'
        });
    });

    test('should correctly parse a class', () => {
        const code = 'class TestClass { constructor() {} }';
        const result = parseClass(code);
        expect(result).toEqual({
            name: 'TestClass',
            methods: []
        });
    });
});

describe('TypeScript Parser', () => {
    test('should correctly parse a TypeScript function', () => {
        const code = 'function testFunc(param: string): boolean { return true; }';
        const result = parseTSFunction(code);
        expect(result).toEqual({
            name: 'testFunc',
            parameters: [{ name: 'param', type: 'string' }],
            returnType: 'boolean',
            body: 'return true;'
        });
    });

    test('should correctly parse a TypeScript class', () => {
        const code = 'class TestClass { constructor(public param: string) {} }';
        const result = parseTSClass(code);
        expect(result).toEqual({
            name: 'TestClass',
            properties: [{ name: 'param', type: 'string' }],
            methods: []
        });
    });
});