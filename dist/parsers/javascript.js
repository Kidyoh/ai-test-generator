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
exports.JavaScriptParser = void 0;
const ts = __importStar(require("typescript"));
class JavaScriptParser {
    /**
     * Parses JavaScript code and extracts components that can be tested
     * @param code The source code to parse
     * @param filePath The path to the source file
     * @returns List of components found in the source
     */
    async parse(code, filePath) {
        const components = [];
        // Create source file, using JS parsing mode for TypeScript's compiler API
        const sourceFile = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
        // Track the current node and its hierarchy
        const parentChain = [];
        // Visit nodes recursively
        const visit = (node) => {
            parentChain.push(node);
            switch (node.kind) {
                case ts.SyntaxKind.FunctionDeclaration:
                    this.processFunctionDeclaration(node, sourceFile, components, code);
                    break;
                case ts.SyntaxKind.ClassDeclaration:
                    this.processClassDeclaration(node, sourceFile, components, code);
                    break;
                case ts.SyntaxKind.MethodDeclaration:
                    this.processMethodDeclaration(node, sourceFile, components, code, this.findParentClass(parentChain));
                    break;
                case ts.SyntaxKind.ArrowFunction:
                    this.processArrowFunction(node, sourceFile, components, code, parentChain);
                    break;
                case ts.SyntaxKind.FunctionExpression:
                    this.processFunctionExpression(node, sourceFile, components, code, parentChain);
                    break;
                // Special case for JavaScript object methods (shorthand syntax)
                case ts.SyntaxKind.PropertyAssignment:
                    const property = node;
                    if (ts.isFunctionExpression(property.initializer) || ts.isArrowFunction(property.initializer)) {
                        this.processObjectMethod(property, sourceFile, components, code);
                    }
                    break;
            }
            ts.forEachChild(node, visit);
            parentChain.pop();
        };
        // Start visiting from the root
        visit(sourceFile);
        return components;
    }
    /**
     * Process function declaration nodes
     */
    processFunctionDeclaration(node, sourceFile, components, code) {
        if (!node.name)
            return; // Skip anonymous functions
        const name = node.name.getText(sourceFile);
        const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
        const nodeText = node.getText(sourceFile);
        const complexity = this.calculateComplexity(node);
        components.push({
            name,
            type: 'function',
            startLine: startLine + 1,
            endLine: endLine + 1,
            code: nodeText,
            needsTest: false, // Will be determined by the analyzer
            complexity
        });
    }
    /**
     * Process class declaration nodes
     */
    processClassDeclaration(node, sourceFile, components, code) {
        if (!node.name)
            return; // Skip anonymous classes
        const name = node.name.getText(sourceFile);
        const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
        const nodeText = node.getText(sourceFile);
        const complexity = this.calculateComplexity(node);
        components.push({
            name,
            type: 'class',
            startLine: startLine + 1,
            endLine: endLine + 1,
            code: nodeText,
            needsTest: false, // Will be determined by the analyzer
            complexity
        });
    }
    /**
     * Process method declaration nodes
     */
    processMethodDeclaration(node, sourceFile, components, code, parentClass) {
        const methodName = node.name.getText(sourceFile);
        let name = methodName;
        // Include class name if available
        if (parentClass && parentClass.name) {
            name = `${parentClass.name.getText(sourceFile)}.${methodName}`;
        }
        const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
        const nodeText = node.getText(sourceFile);
        const complexity = this.calculateComplexity(node);
        components.push({
            name,
            type: 'method',
            startLine: startLine + 1,
            endLine: endLine + 1,
            code: nodeText,
            needsTest: false, // Will be determined by the analyzer
            complexity
        });
    }
    /**
     * Process arrow function expressions
     */
    processArrowFunction(node, sourceFile, components, code, parentChain) {
        // Try to get the name from the parent (if it's a variable declaration)
        let name = "anonymousFunction";
        // Try to extract the name from a variable declaration
        const parent = parentChain[parentChain.length - 2];
        if (parent && ts.isVariableDeclaration(parent) && parent.name) {
            name = parent.name.getText(sourceFile);
        }
        // Or from property assignment
        if (parent && ts.isPropertyAssignment(parent) && parent.name) {
            name = parent.name.getText(sourceFile);
        }
        const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
        const nodeText = node.getText(sourceFile);
        const complexity = this.calculateComplexity(node);
        // Only track non-trivial arrow functions (those with more than a simple return)
        if (complexity > 1 || (node.body && ts.isExpressionStatement(node.body.parent))) {
            components.push({
                name,
                type: 'function',
                startLine: startLine + 1,
                endLine: endLine + 1,
                code: nodeText,
                needsTest: false, // Will be determined by the analyzer
                complexity
            });
        }
    }
    /**
     * Process function expressions
     */
    processFunctionExpression(node, sourceFile, components, code, parentChain) {
        // Try to get the name from the parent (if it's a variable declaration)
        let name = node.name?.getText(sourceFile) || "anonymousFunction";
        // Try to extract the name from a variable declaration
        const parent = parentChain[parentChain.length - 2];
        if (parent && ts.isVariableDeclaration(parent) && parent.name) {
            name = parent.name.getText(sourceFile);
        }
        // Or from property assignment
        if (parent && ts.isPropertyAssignment(parent) && parent.name) {
            name = parent.name.getText(sourceFile);
        }
        const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
        const nodeText = node.getText(sourceFile);
        const complexity = this.calculateComplexity(node);
        components.push({
            name,
            type: 'function',
            startLine: startLine + 1,
            endLine: endLine + 1,
            code: nodeText,
            needsTest: false, // Will be determined by the analyzer
            complexity
        });
    }
    /**
     * Process object method (shorthand or property with function)
     */
    processObjectMethod(node, sourceFile, components, code) {
        const propertyName = node.name.getText(sourceFile);
        // Try to find parent object for naming context (e.g., "objName.methodName")
        let objectName = "";
        let parentNode = node.parent;
        if (ts.isObjectLiteralExpression(parentNode)) {
            const objParent = parentNode.parent;
            if (ts.isVariableDeclaration(objParent) && objParent.name) {
                objectName = objParent.name.getText(sourceFile) + ".";
            }
            else if (ts.isPropertyAssignment(objParent) && objParent.name) {
                objectName = objParent.name.getText(sourceFile) + ".";
            }
        }
        const name = objectName + propertyName;
        const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
        const nodeText = node.getText(sourceFile);
        const complexity = this.calculateComplexity(node.initializer);
        components.push({
            name,
            type: 'function',
            startLine: startLine + 1,
            endLine: endLine + 1,
            code: nodeText,
            needsTest: false, // Will be determined by the analyzer
            complexity
        });
    }
    /**
     * Calculate the cyclomatic complexity of a node
     */
    calculateComplexity(node) {
        let complexity = 1; // Base complexity
        // Count conditions, loops, and other complexity indicators
        const incrementComplexity = (node) => {
            switch (node.kind) {
                // Control flow statements
                case ts.SyntaxKind.IfStatement:
                case ts.SyntaxKind.ConditionalExpression: // ternary
                case ts.SyntaxKind.ForStatement:
                case ts.SyntaxKind.ForInStatement:
                case ts.SyntaxKind.ForOfStatement:
                case ts.SyntaxKind.WhileStatement:
                case ts.SyntaxKind.DoStatement:
                case ts.SyntaxKind.CaseClause:
                case ts.SyntaxKind.CatchClause:
                    complexity++;
                    break;
                // Logical operators can add complexity
                case ts.SyntaxKind.BinaryExpression:
                    const binary = node;
                    if (binary.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
                        binary.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
                        complexity++;
                    }
                    break;
            }
            ts.forEachChild(node, incrementComplexity);
        };
        incrementComplexity(node);
        return complexity;
    }
    /**
     * Find the parent class of a node in the parent chain
     */
    findParentClass(parentChain) {
        for (let i = parentChain.length - 1; i >= 0; i--) {
            if (ts.isClassDeclaration(parentChain[i])) {
                return parentChain[i];
            }
        }
        return undefined;
    }
}
exports.JavaScriptParser = JavaScriptParser;
