# AI Test Generator

### Command Line Interface

```bash
# Will interactively prompt for API key if not provided
ai-test-generator

# Generate tests for a specific file
ai-test-generator --file ./src/utils/helpers.js

# Specify test framework
ai-test-generator --framework jest

# Set output directory
ai-test-generator --output ./custom-tests

# Preview without writing files
ai-test-generator --dry-run

# Use specific Gemini model
ai-test-generator --model gemini-1.5-pro

# Skip interactive prompting
ai-test-generator --non-interactive

# Control API rate limiting (for quota management)
ai-test-generator --request-delay 3000 --batch-size 5 --batch-delay 10000


# Quota-friendly modes - for when you're hitting API limits
ai-test-generator --quota-friendly --file ./src/utils/helpers.js
ai-test-generator --ultra-quota-friendly --file ./src/utils/helpers.js

# Offline mode - generates templates without API calls
ai-test-generator --offline --file ./src/utils/helpers.js
```

### Programmatic API

```javascript
import AITestGenerator from 'ai-test-generator';

const generator = new AITestGenerator({
  testFramework: 'jest',
  apiKey: 'your_gemini_api_key', // Optional - will prompt if not provided
  outputDir: './tests',
  verbose: true
});

// Generate tests for a file
await generator.generateForFile('./src/utils/helpers.js');

// Generate tests for entire codebase
await generator.generateForCodebase('./src');
```

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

### Configuration File

Or use a configuration file `.ai-test-generator.json`:

```json
{
  "apiKey": "your_gemini_api_key_here",
  "testFramework": "jest",
  "outputDir": "./custom-tests-folder"
}
```

## API Options

| Option | Description | Default |
|--------|-------------|---------|
| `testFramework` | Testing framework to use (`jest`, `mocha`, `vitest`) | `'jest'` |
| `outputDir` | Directory for generated tests | `'./tests'` |
| `apiKey` | Gemini API key | `undefined` |
| `interactive` | Prompt for API key if not found | `true` |
| `aiModel` | Gemini model to use | `'gemini-1.5-flash'` |
| `testStyle` | Type of tests to generate (`unit`, `integration`, `both`) | `'unit'` |
| `dryRun` | Preview without writing files | `false` |
| `verbose` | Show detailed output | `false` |
| `coverage` | Target code coverage percentage | `80` |
| `includeSnapshot` | Include snapshot tests | `false` |
| `requestDelay` | Delay between API requests in ms | `1000` |
| `batchSize` | Number of components to process before pausing | `5` |
| `batchDelay` | Delay between batches in ms | `5000` |

## How It Works

AI Test Generator uses a 3-step process:

1. **Analysis**: Scans your codebase to find functions, classes, and methods that need tests
2. **AI Generation**: Uses Gemini AI to create appropriate test cases for each component
3. **Output**: Generates properly formatted test files with your chosen testing framework

The tool intelligently determines which components need tests based on complexity, importance, and other factors.

## Examples

### Testing a Utility Function

```javascript
// Original code (utils.js)
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

// Generated test (utils.test.js)
import { formatCurrency } from './utils';

describe('formatCurrency', () => {
  test('formats USD currency correctly', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
  });
  
  test('formats EUR currency correctly', () => {
    expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00');
  });
  
  test('handles zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
});
```

## Contributing

Contributions are welcome! Feel free to:

1. Open issues for bugs or feature requests
2. Submit pull requests
3. Improve documentation

## License

MIT

---

Created with ❤️ by Kidus

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

- 🤖 Automatically analyzes your code to identify testable components
- ✨ Generates comprehensive tests using Google's Gemini AI
- 🧪 Supports Jest, Mocha, and Vitest testing frameworks
- 🔄 Works with both JavaScript and TypeScript projects
- 💬 Interactive mode for easy API key setup
- ⚙️ Customizable test generation options
- 🛠️ Available as both CLI tool and programmable API

## Installation

```bash
npm install ai-test-generator
```

Or globally:

```bash
npm install -g ai-test-generator
```

## Requirements

- Node.js 16 or higher
- A Google Gemini API key (Get one from [Google AI Studio](https://makersuite.google.com/app/apikey))

## Usage

To use the AI Test Generator, you can run the command-line interface (CLI) provided in the package. Here’s a basic example:

```
npx ai-test-generator <path-to-your-code>
```

Replace `<path-to-your-code>` with the path to the directory containing your codebase. The tool will analyze the code and generate test cases accordingly.

## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.