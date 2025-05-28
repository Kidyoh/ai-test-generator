import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

export interface AIClientOptions {
  apiKey?: string;
  model?: string;
  timeout?: number;
  maxRetries?: number;
  interactive?: boolean; // New option to enable/disable interactive prompting
}

export class AIClient {
  private apiKey: string;
  private model: string;
  private timeout: number;
  private maxRetries: number;
  private genAI: GoogleGenerativeAI;
  private generativeModel: GenerativeModel;
  private interactive: boolean;
  
  constructor(options: AIClientOptions = {}) {
    // Enable interactive mode by default
    this.interactive = options.interactive ?? true;
    
    // Try to load API key from various sources
    this.apiKey = options.apiKey || process.env.GEMINI_API_KEY || this.loadApiKeyFromConfig();
    
    // If no API key and interactive mode is enabled, prompt the user
    if (!this.apiKey && this.interactive) {
      this.apiKey = 'pending-input';
    } else if (!this.apiKey) {
      throw new Error('API key is required. Set it via options, GEMINI_API_KEY environment variable, or in the config file.');
    }
    
    // Set default options with overrides
    this.model = options.model || 'gemini-1.5-flash';
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
    
    // Initialize with dummy values first - will be properly initialized later
    this.genAI = new GoogleGenerativeAI("dummy-key");
    this.generativeModel = this.genAI.getGenerativeModel({ model: this.model });
    
    // Initialize the Gemini client properly if we have an API key
    if (this.apiKey !== 'pending-input') {
      this.initializeClient();
    }
  }
  
  /**
   * Initialize the Gemini client
   */
  private initializeClient(): void {
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.generativeModel = this.genAI.getGenerativeModel({ model: this.model });
  }
  
  /**
   * Prompt the user for their API key in the terminal
   * @returns Promise that resolves with the entered API key
   */
  private async promptForApiKey(): Promise<string> {
    const rl = readline.createInterface({
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
  private async saveApiKey(apiKey: string): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), '.ai-test-generator.json');
      
      // Create or read existing config
      let config: Record<string, any> = {};
      if (fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, 'utf8');
        try {
          config = JSON.parse(fileContent);
        } catch (e) {
          // If the file exists but isn't valid JSON, start with empty object
        }
      }
      
      // Update with new API key
      config.apiKey = apiKey;
      
      // Write back to file
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      console.log(`✅ API key saved to ${configPath}`);
    } catch (error) {
      console.warn('Failed to save API key to config file:', error);
    }
  }
  
  /**
   * Send a prompt to the AI and get a completion
   * @param prompt The prompt to send to the AI
   * @returns The AI's response
   */
  async complete(prompt: string): Promise<string> {
    // If API key is pending input, prompt for it first
    if (this.apiKey === 'pending-input') {
      const apiKey = await this.promptForApiKey();
      
      if (!apiKey) {
        throw new Error('API key is required to generate tests.');
      }
      
      this.apiKey = apiKey;
      this.initializeClient();
      
      // Ask if they want to save it for future use
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const saveResponse = await new Promise<string>((resolve) => {
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
    let lastError: Error | null = null;
    
    while (attempts < this.maxRetries) {
      try {
        return await this.sendRequest(prompt);
      } catch (error) {
        lastError = error as Error;
        attempts++;
        
        // Wait a bit longer between retries
        const delay = Math.pow(2, attempts) * 1000;
        console.warn(`AI request failed, retrying in ${delay}ms (attempt ${attempts}/${this.maxRetries})`);
        await this.sleep(delay);
      }
    }
    
    throw new Error(`Failed to get response from AI after ${this.maxRetries} attempts: ${lastError?.message}`);
  }
  
  /**
   * Send a request to the Gemini API
   * @param prompt The prompt to send to the AI
   * @returns The AI's response text
   */
  private async sendRequest(prompt: string): Promise<string> {
    try {
      // Create system prompt for test generation
      const systemPrompt = 'You are a helpful assistant that specializes in writing test code. Generate high quality unit tests with proper mocking and test coverage.';
      
      // Use Gemini's generation API
      const result = await this.generativeModel.generateContent({
        contents: [{ 
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      });

      // Extract response text
      const responseText = result.response.text();
      if (!responseText) {
        throw new Error('Empty response from Gemini');
      }

      return responseText;
    } catch (error) {
      throw new Error(`Gemini API error: ${(error as Error).message}`);
    }
  }
  
  /**
   * Try to load the API key from a config file
   * @returns The API key if found, otherwise an empty string
   */
  private loadApiKeyFromConfig(): string {
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
    } catch (error) {
      console.warn('Failed to load API key from config file:', error);
      return '';
    }
  }
  
  /**
   * Sleep for a specified duration
   * @param ms Milliseconds to sleep
   * @returns Promise that resolves after the specified time
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Change the AI model
   * @param model Model identifier
   * @returns This client instance for chaining
   */
  setModel(model: string): AIClient {
    this.model = model;
    this.generativeModel = this.genAI.getGenerativeModel({ model: this.model });
    return this;
  }
  
  /**
   * Change the API key
   * @param apiKey New API key
   * @returns This client instance for chaining
   */
  setApiKey(apiKey: string): AIClient {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.generativeModel = this.genAI.getGenerativeModel({ model: this.model });
    return this;
  }
}