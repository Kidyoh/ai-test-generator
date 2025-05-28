export interface AIClientOptions {
    apiKey?: string;
    model?: string;
    timeout?: number;
    maxRetries?: number;
    interactive?: boolean;
}
export declare class AIClient {
    private apiKey;
    private model;
    private timeout;
    private maxRetries;
    private genAI;
    private generativeModel;
    private interactive;
    constructor(options?: AIClientOptions);
    /**
     * Initialize the Gemini client
     */
    private initializeClient;
    /**
     * Prompt the user for their API key in the terminal
     * @returns Promise that resolves with the entered API key
     */
    private promptForApiKey;
    /**
     * Save the API key to a config file for future use
     * @param apiKey The API key to save
     */
    private saveApiKey;
    /**
     * Send a prompt to the AI and get a completion
     * @param prompt The prompt to send to the AI
     * @returns The AI's response
     */
    complete(prompt: string): Promise<string>;
    /**
     * Send a request to the Gemini API
     * @param prompt The prompt to send to the AI
     * @returns The AI's response text
     */
    private sendRequest;
    /**
     * Try to load the API key from a config file
     * @returns The API key if found, otherwise an empty string
     */
    private loadApiKeyFromConfig;
    /**
     * Sleep for a specified duration
     * @param ms Milliseconds to sleep
     * @returns Promise that resolves after the specified time
     */
    private sleep;
    /**
     * Change the AI model
     * @param model Model identifier
     * @returns This client instance for chaining
     */
    setModel(model: string): AIClient;
    /**
     * Change the API key
     * @param apiKey New API key
     * @returns This client instance for chaining
     */
    setApiKey(apiKey: string): AIClient;
}
