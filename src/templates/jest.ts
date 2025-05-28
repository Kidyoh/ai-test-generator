export const jestTemplate = (testCaseName: string, testCaseBody: string) => `
describe('${testCaseName}', () => {
    test('${testCaseName} should work as expected', () => {
        ${testCaseBody}
    });
});
`;