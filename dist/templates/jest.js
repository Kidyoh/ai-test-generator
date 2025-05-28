"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jestTemplate = void 0;
const jestTemplate = (testCaseName, testCaseBody) => `
describe('${testCaseName}', () => {
    test('${testCaseName} should work as expected', () => {
        ${testCaseBody}
    });
});
`;
exports.jestTemplate = jestTemplate;
