import * as path from 'path';

export function run(): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            console.log('Loading test files...');
            
            // Import all test files - this will register the suites and tests
            // These files use VS Code's suite() and test() globals
            const testFiles = [
                '../configuration.test',
                '../extension.test', 
                '../complexityAnalyzer/complexityAnalyzerFactory.test',
                '../complexityAnalyzer/languages/csharpAnalyzer.test',
                '../providers/codeLensProvider.test'
            ];

            testFiles.forEach(testFile => {
                try {
                    console.log(`Loading test file: ${testFile}`);
                    require(testFile);
                } catch (error) {
                    console.warn(`Could not load test file ${testFile}:`, error);
                }
            });

            console.log('All test files loaded successfully');
            resolve();
        } catch (err) {
            console.error('Error loading test files:', err);
            reject(err);
        }
    });
}