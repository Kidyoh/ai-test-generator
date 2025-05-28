import AITestGenerator from './src/index';

async function testGemini() {
  const generator = new AITestGenerator({
    testFramework: 'jest',
    aiModel: 'gemini-1.5-pro', // Specify Gemini model
    outputDir: './generated-tests',
    verbose: true,
    dryRun: true // Set to false when you want to save files
  });

  try {
    // Test on a simple file
    await generator.generateForFile('./src/core/analyzer.ts');
    console.log('✅ Test generation completed successfully');
  } catch (error) {
    console.error('❌ Test generation failed:', error);
  }
}

testGemini();