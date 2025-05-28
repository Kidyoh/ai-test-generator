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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIClient = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
const readline_1 = __importDefault(require("readline"));
// Load environment variables
dotenv_1.default.config();
class AIClient {
    constructor(options = {}) {
        // Enable interactive mode by default
        this.interactive = options.interactive ?? true;
        // Strict quota mode is disabled by default
        this.strictQuotaMode = options.strictQuotaMode ?? false;
        // Try to load API key from various sources
        this.apiKey = options.apiKey || process.env.GEMINI_API_KEY || this.loadApiKeyFromConfig();
        // If no API key and interactive mode is enabled, prompt the user
        if (!this.apiKey && this.interactive) {
            this.apiKey = 'pending-input';
        }
        else if (!this.apiKey) {
            throw new Error('API key is required. Set it via options, GEMINI_API_KEY environment variable, or in the config file.');
        }
        // Set default options with overrides
        this.model = options.model || 'gemini-1.5-flash'; // Using the less resource-intensive model by default
        this.timeout = options.timeout || 60000; // Increased timeout for quota issues
        this.maxRetries = options.maxRetries || 5; // Increased retries for quota issues
        // Initialize with dummy values first - will be properly initialized later
        this.genAI = new generative_ai_1.GoogleGenerativeAI("dummy-key");
        this.generativeModel = this.genAI.getGenerativeModel({ model: this.model });
        // Initialize the Gemini client properly if we have an API key
        if (this.apiKey !== 'pending-input') {
            this.initializeClient();
        }
        // Set offline mode if specified
        this.offlineMode = options.offlineMode ?? false;
    }
    /**
     * Initialize the Gemini client
     */
    initializeClient() {
        this.genAI = new generative_ai_1.GoogleGenerativeAI(this.apiKey);
        this.generativeModel = this.genAI.getGenerativeModel({ model: this.model });
    }
    /**
     * Prompt the user for their API key in the terminal
     * @returns Promise that resolves with the entered API key
     */
    async promptForApiKey() {
        const rl = readline_1.default.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        return new Promise((resolve) => {
            console.log('\n🔑 AI Test Generator needs a Google Gemini API key to function.');
            console.log('You can get one from: https://makersuite.google.com/app/apikey\n');
            rl.question('Please enter your Gemini API key: ', (apiKey) => {
                rl.close();
                console.log('\n'); // Add some spacing after input
                resolve(apiKey.trim());
            });
        });
    }
    /**
     * Save the API key to a config file for future use
     * @param apiKey The API key to save
     */
    async saveApiKey(apiKey) {
        try {
            const configPath = path.join(process.cwd(), '.ai-test-generator.json');
            // Create or read existing config
            let config = {};
            if (fs.existsSync(configPath)) {
                const fileContent = fs.readFileSync(configPath, 'utf8');
                try {
                    config = JSON.parse(fileContent);
                }
                catch (e) {
                    // If the file exists but isn't valid JSON, start with empty object
                }
            }
            // Update with new API key
            config.apiKey = apiKey;
            // Write back to file
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
            console.log(`✅ API key saved to ${configPath}`);
        }
        catch (error) {
            console.warn('Failed to save API key to config file:', error);
        }
    }
    /**
     * Send a prompt to the AI and get a completion
     * @param prompt The prompt to send to the AI
     * @returns The AI's response
     */
    async complete(prompt) {
        // Check for offline mode first
        if (this.offlineMode) {
            console.log('📴 Running in offline mode - generating simple test template without API call');
            return this.generateOfflineTemplate(prompt);
        }
        // If API key is pending input, prompt for it first
        if (this.apiKey === 'pending-input') {
            const apiKey = await this.promptForApiKey();
            if (!apiKey) {
                throw new Error('API key is required to generate tests.');
            }
            this.apiKey = apiKey;
            this.initializeClient();
            // Ask if they want to save it for future use
            const rl = readline_1.default.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            const saveResponse = await new Promise((resolve) => {
                rl.question('Would you like to save this API key for future use? (y/n): ', (answer) => {
                    rl.close();
                    resolve(answer.trim().toLowerCase());
                });
            });
            if (saveResponse === 'y' || saveResponse === 'yes') {
                await this.saveApiKey(this.apiKey);
            }
        }
        // Now proceed with the API call
        let attempts = 0;
        let lastError = null;
        // MUCH more conservative delays
        let baseDelay = this.strictQuotaMode ? 30000 : 2000; // 30 seconds base delay in strict mode
        while (attempts < this.maxRetries) {
            try {
                // In strict quota mode, enforce a mandatory wait before EVERY request
                if (this.strictQuotaMode) {
                    const waitTime = 30000 + Math.random() * 15000; // 30-45 second wait
                    console.log(`🐢 Ultra-strict quota mode - waiting ${Math.round(waitTime / 1000)} seconds before request...`);
                    await this.sleep(waitTime);
                }
                return await this.sendRequest(prompt);
            }
            catch (error) {
                const err = error;
                lastError = err;
                attempts++;
                // Check if it's a quota-related error
                const isQuota = err.message.includes('quota') ||
                    err.message.includes('429') ||
                    err.message.includes('Too Many Requests');
                if (isQuota) {
                    // For quota errors, extract retry delay if available from the error message
                    const retryMatch = err.message.match(/retryDelay:"(\d+)s"/);
                    const suggestedDelay = retryMatch ? parseInt(retryMatch[1]) * 1000 : null;
                    // Use the suggested delay plus extra buffer, or a very long delay
                    const quotaDelay = (suggestedDelay || 60000) + 15000 + Math.random() * 30000;
                    console.warn(`⚠️ Quota limit hit. Waiting ${Math.round(quotaDelay / 1000)} seconds before retry...`);
                    await this.sleep(quotaDelay);
                }
                else {
                    // Regular exponential backoff for other errors
                    const delay = baseDelay * Math.pow(2, attempts);
                    console.warn(`AI request failed, retrying in ${Math.round(delay / 1000)}s (attempt ${attempts}/${this.maxRetries})`);
                    await this.sleep(delay);
                }
            }
        }
        throw new Error(`Failed to get response from AI after ${this.maxRetries} attempts: ${lastError?.message}`);
    }
    /**
     * Send a request to the Gemini API
     * @param prompt The prompt to send to the AI
     * @returns The AI's response text
     */
    async sendRequest(prompt) {
        // Create system prompt for test generation
        const systemPrompt = 'You are a helpful assistant that specializes in writing test code. Generate high quality unit tests with proper mocking and test coverage.';
        try {
            let finalPrompt = prompt;
            // In strict quota mode, trim the prompt significantly to reduce token usage
            if (this.strictQuotaMode && prompt.length > 2000) {
                finalPrompt = prompt.substring(0, 600) +
                    '\n\n[Content trimmed to reduce token usage]\n\n' +
                    prompt.substring(prompt.length - 600);
                console.log(`🔍 Using ultra-reduced prompt size (${finalPrompt.length} chars) to stay within quota limits`);
            }
            // Use much more conservative settings in strict mode
            const result = await this.generativeModel.generateContent({
                contents: [{
                        role: 'user',
                        parts: [{ text: `${systemPrompt}\n\n${finalPrompt}` }]
                    }],
                generationConfig: {
                    temperature: 0.1,
                    topK: 20,
                    topP: 0.8,
                    maxOutputTokens: this.strictQuotaMode ? 1024 : 4096, // Much smaller in strict mode
                },
            });
            // Extract response text
            const responseText = result.response.text();
            if (!responseText) {
                throw new Error('Empty response from Gemini');
            }
            return responseText;
        }
        catch (error) {
            throw new Error(`Gemini API error: ${error.message}`);
        }
    }
    /**
     * Try to load the API key from a config file
     * @returns The API key if found, otherwise an empty string
     */
    loadApiKeyFromConfig() {
        try {
            // Look for config in several standard locations
            const configPaths = [
                path.join(process.cwd(), '.ai-test-generator.json'),
                path.join(process.cwd(), 'config', 'ai-test-generator.json'),
                path.join(process.cwd(), '.config', 'ai-test-generator.json'),
            ];
            for (const configPath of configPaths) {
                if (fs.existsSync(configPath)) {
                    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                    if (config.apiKey) {
                        return config.apiKey;
                    }
                }
            }
            return '';
        }
        catch (error) {
            console.warn('Failed to load API key from config file:', error);
            return '';
        }
    }
    /**
     * Sleep for a specified duration
     * @param ms Milliseconds to sleep
     * @returns Promise that resolves after the specified time
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Change the AI model
     * @param model Model identifier
     * @returns This client instance for chaining
     */
    setModel(model) {
        this.model = model;
        this.generativeModel = this.genAI.getGenerativeModel({ model: this.model });
        return this;
    }
    /**
     * Change the API key
     * @param apiKey New API key
     * @returns This client instance for chaining
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        this.genAI = new generative_ai_1.GoogleGenerativeAI(this.apiKey);
        this.generativeModel = this.genAI.getGenerativeModel({ model: this.model });
        return this;
    }
    /**
     * Enable or disable strict quota mode
     * @param enabled Whether strict quota mode should be enabled
     * @returns This client instance for chaining
     */
    setStrictQuotaMode(enabled) {
        this.strictQuotaMode = enabled;
        return this;
    }
    /**
     * Enable or disable offline mode
     * @param enabled Whether offline mode should be enabled
     * @returns This client instance for chaining
     */
    setOfflineMode(enabled) {
        this.offlineMode = enabled;
        return this;
    }
    /**
     * Generate a test template in offline mode
     * @param prompt The prompt containing the component code
     * @returns A string with the test template
     */
    generateOfflineTemplate(prompt) {
        // Extract component name from prompt
        const nameMatch = prompt.match(/Here's the component to test:\\s*```(?:javascript|typescript)\\s*.*?(?:function|class|const)\\s+([a-zA-Z0-9_]+)/s);
        const componentName = nameMatch ? nameMatch[1] : 'UnknownComponent';
        // Check if it's likely a class
        const isClass = prompt.includes('class ');
        if (isClass) {
            return `import { ${componentName} } from './path-to-module';

describe('${componentName}', () => {
  let instance;

  beforeEach(() => {
    instance = new ${componentName}();
  });

  test('should be defined', () => {
    expect(instance).toBeDefined();
  });

  // Add more tests here based on the component's methods
  // This is a placeholder generated in offline mode
});`;
        }
        else {
            return `import { ${componentName} } from './path-to-module';

describe('${componentName}', () => {
  test('should be defined', () => {
    expect(${componentName}).toBeDefined();
  });

  // Add more tests here based on the function's behavior
  // This is a placeholder generated in offline mode
});`;
        }
    }
}
exports.AIClient = AIClient;
