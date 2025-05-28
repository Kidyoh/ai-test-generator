"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPrompt = createPrompt;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Create a prompt for the AI to generate test code
 * @param options Options for the prompt
 * @returns Formatted prompt string
 */
function createPrompt(options) {
    const { component, sourceFilePath, testFramework, testStyle, coverage, includeSnapshot } = options;
    // Read the full source file to provide context
    let sourceContext = '';
    try {
        sourceContext = fs.readFileSync(sourceFilePath, 'utf8');
    }
    catch (error) {
        console.warn(`Could not read source file ${sourceFilePath} for context:`, error);
        sourceContext = component.code;
    }
    // Extract imports from the source file to help with proper imports in tests
    const importLines = sourceContext
        .split('\n')
        .filter(line => line.trim().startsWith('import ') || line.trim().startsWith('const ') && line.includes(' = require('))
        .join('\n');
    // Get file extension for language-specific guidance
    const fileExt = path.extname(sourceFilePath).substring(1);
    const isTypescript = ['ts', 'tsx'].includes(fileExt);
    // Build the prompt
    return `
Generate a ${testStyle} test for the following ${component.type} using ${testFramework}. 
${coverage ? `Aim for at least ${coverage}% code coverage. ` : ''}
${includeSnapshot ? 'Include snapshot tests where appropriate. ' : ''}

Here's the component to test:

\`\`\`${isTypescript ? 'typescript' : 'javascript'}
${component.code}
\`\`\`

Here are the imports from the source file that may be relevant:

\`\`\`${isTypescript ? 'typescript' : 'javascript'}
${importLines}
\`\`\`

The file path is: ${sourceFilePath}

Guidelines:
1. Write tests that thoroughly verify the functionality
2. Include tests for error cases and edge conditions
3. Use proper mocking for external dependencies
4. Follow best practices for ${testFramework}
5. Use descriptive test names that explain what is being tested
6. Include only the test code, no explanations or comments outside the code
7. Make the tests maintainable and readable

${isTypescript ? 'Use TypeScript for the tests and ensure proper type handling.' : ''}
`;
}
