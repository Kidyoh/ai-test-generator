import AITestGenerator from './src/index';

async function testRun() {
  console.log('🧪 Running test of AI Test Generator...');
  
  const generator = new AITestGenerator({
    testFramework: 'jest',
    dryRun: true, // Don't actually write files during testing
    verbose: true, // Show detailed output
  });
  
  try {
    // Test on the analyzer file itself
    console.log('Testing on a single file...');
    await generator.generateForFile('./src/core/analyzer.ts');
    
    console.log('\n✅ Test run completed successfully!');
    console.log('Ready for npm publication.');
  } catch (error) {
    console.error('\n❌ Test run failed:', error);
    process.exit(1);
  }
}

testRun();