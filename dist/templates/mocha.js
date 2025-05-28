"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mochaTemplate = void 0;
const mochaTemplate = (testCaseName, testCaseBody) => {
    return `
describe('${testCaseName}', () => {
    it('should', async () => {
        ${testCaseBody}
    });
});
`;
};
exports.mochaTemplate = mochaTemplate;
