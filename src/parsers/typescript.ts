import * as ts from 'typescript';
import * as fs from 'fs';
import { Component } from '../core/analyzer';

export class TypeScriptParser {
  /**
   * Parses TypeScript code and extracts components that can be tested
   * @param code The source code to parse
   * @param filePath The path to the source file
   * @returns List of components found in the source
   */
  async parse(code: string, filePath: string): Promise<Component[]> {
    const components: Component[] = [];
    
    // Create source file
    const sourceFile = ts.createSourceFile(
      filePath,
      code,
      ts.ScriptTarget.Latest,
      true
    );
    
    // Track the current node and its hierarchy
    const parentChain: ts.Node[] = [];
    
    // Visit nodes recursively
    const visit = (node: ts.Node) => {
      parentChain.push(node);
      
      switch (node.kind) {
        case ts.SyntaxKind.FunctionDeclaration:
          this.processFunctionDeclaration(node as ts.FunctionDeclaration, sourceFile, components, code);
          break;
          
        case ts.SyntaxKind.ClassDeclaration:
          this.processClassDeclaration(node as ts.ClassDeclaration, sourceFile, components, code);
          break;
          
        case ts.SyntaxKind.MethodDeclaration:
          this.processMethodDeclaration(
            node as ts.MethodDeclaration, 
            sourceFile, 
            components, 
            code, 
            this.findParentClass(parentChain)
          );
          break;
          
        case ts.SyntaxKind.InterfaceDeclaration:
          this.processInterfaceDeclaration(node as ts.InterfaceDeclaration, sourceFile, components, code);
          break;
          
        case ts.SyntaxKind.ArrowFunction:
          this.processArrowFunction(node as ts.ArrowFunction, sourceFile, components, code, parentChain);
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
  private processFunctionDeclaration(
    node: ts.FunctionDeclaration, 
    sourceFile: ts.SourceFile, 
    components: Component[],
    code: string
  ) {
    if (!node.name) return; // Skip anonymous functions
    
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
  private processClassDeclaration(
    node: ts.ClassDeclaration, 
    sourceFile: ts.SourceFile, 
    components: Component[],
    code: string
  ) {
    if (!node.name) return; // Skip anonymous classes
    
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
  private processMethodDeclaration(
    node: ts.MethodDeclaration, 
    sourceFile: ts.SourceFile, 
    components: Component[],
    code: string,
    parentClass?: ts.ClassDeclaration
  ) {
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
   * Process interface declaration nodes
   */
  private processInterfaceDeclaration(
    node: ts.InterfaceDeclaration, 
    sourceFile: ts.SourceFile, 
    components: Component[],
    code: string
  ) {
    const name = node.name.getText(sourceFile);
    const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    
    const nodeText = node.getText(sourceFile);
    // Interfaces typically have low complexity as they're just declarations
    const complexity = 1;
    
    components.push({
      name,
      type: 'interface',
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
  private processArrowFunction(
    node: ts.ArrowFunction, 
    sourceFile: ts.SourceFile, 
    components: Component[],
    code: string,
    parentChain: ts.Node[]
  ) {
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
   * Calculate the cyclomatic complexity of a node
   */
  private calculateComplexity(node: ts.Node): number {
    let complexity = 1; // Base complexity
    
    // Count conditions, loops, and other complexity indicators
    const incrementComplexity = (node: ts.Node) => {
      switch(node.kind) {
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
          const binary = node as ts.BinaryExpression;
          if (
            binary.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
            binary.operatorToken.kind === ts.SyntaxKind.BarBarToken
          ) {
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
  private findParentClass(parentChain: ts.Node[]): ts.ClassDeclaration | undefined {
    for (let i = parentChain.length - 1; i >= 0; i--) {
      if (ts.isClassDeclaration(parentChain[i])) {
        return parentChain[i] as ts.ClassDeclaration;
      }
    }
    return undefined;
  }
}