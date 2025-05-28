export interface AIClientOptions {
    apiKey?: string;
    model?: string;
    timeout?: number;
    maxRetries?: number;
    interactive?: boolean;
    strictQuotaMode?: boolean;
    offlineMode?: boolean;
}
export declare class AIClient {
    private apiKey;
    private model;
    private timeout;
    private maxRetries;
    private genAI;
    private generativeModel;
    private interactive;
    private strictQuotaMode;
    private offlineMode;
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
    /**
     * Enable or disable strict quota mode
     * @param enabled Whether strict quota mode should be enabled
     * @returns This client instance for chaining
     */
    setStrictQuotaMode(enabled: boolean): AIClient;
    /**
     * Enable or disable offline mode
     * @param enabled Whether offline mode should be enabled
     * @returns This client instance for chaining
     */
    setOfflineMode(enabled: boolean): AIClient;
    /**
     * Generate a test template in offline mode
     * @param prompt The prompt containing the component code
     * @returns A string with the test template
     */
    private generateOfflineTemplate;
}
