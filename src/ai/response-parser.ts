export function parseResponse(response: any): any {
    if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
    }

    const testCases = response.testCases || [];
    return testCases.map((testCase: any) => ({
        name: testCase.name || 'Unnamed Test',
        description: testCase.description || '',
        code: testCase.code || '',
    }));
}