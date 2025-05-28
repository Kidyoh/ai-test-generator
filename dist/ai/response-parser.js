"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResponse = parseResponse;
function parseResponse(response) {
    if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
    }
    const testCases = response.testCases || [];
    return testCases.map((testCase) => ({
        name: testCase.name || 'Unnamed Test',
        description: testCase.description || '',
        code: testCase.code || '',
    }));
}
