export const mochaTemplate = (testCaseName: string, testCaseBody: string) => {
    return `
describe('${testCaseName}', () => {
    it('should', async () => {
        ${testCaseBody}
    });
});
`;
};