import { Component } from '../core/analyzer';
export declare class JavaScriptParser {
    /**
     * Parses JavaScript code and extracts components that can be tested
     * @param code The source code to parse
     * @param filePath The path to the source file
     * @returns List of components found in the source
     */
    parse(code: string, filePath: string): Promise<Component[]>;
    /**
     * Process function declaration nodes
     */
    private processFunctionDeclaration;
    /**
     * Process class declaration nodes
     */
    private processClassDeclaration;
    /**
     * Process method declaration nodes
     */
    private processMethodDeclaration;
    /**
     * Process arrow function expressions
     */
    private processArrowFunction;
    /**
     * Process function expressions
     */
    private processFunctionExpression;
    /**
     * Process object method (shorthand or property with function)
     */
    private processObjectMethod;
    /**
     * Calculate the cyclomatic complexity of a node
     */
    private calculateComplexity;
    /**
     * Find the parent class of a node in the parent chain
     */
    private findParentClass;
}
