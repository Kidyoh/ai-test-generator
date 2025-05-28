export function log(message: string): void {
    console.log(`[LOG] ${message}`);
}

export function error(message: string): void {
    console.error(`[ERROR] ${message}`);
}

export function validateInput(input: any): boolean {
    // Implement validation logic as needed
    return input !== null && input !== undefined;
}