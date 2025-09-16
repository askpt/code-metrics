// Debug script to understand complexity calculation
const { CSharpCognitiveComplexityAnalyzer } = require('./out/complexityAnalyzer/languages/csharpAnalyzer');

const analyzer = new CSharpCognitiveComplexityAnalyzer();

const sourceCode = `
public class Test {
    public string Process(int value) {
        if (value > 0) {
            for (int i = 0; i < value; i++) {
                if (i % 2 == 0) {
                    continue;
                }
            }
        }
        return value.ToString();
    }
}
`;

console.log('=== Debugging Multiple Control Flow Test ===');
const results = analyzer.analyzeFunctions(sourceCode);
console.log('Results:', results);

if (results.length > 0) {
    console.log('Function:', results[0].name);
    console.log('Total complexity:', results[0].complexity);
    console.log('Details:');
    results[0].details.forEach((detail, i) => {
        console.log(`  ${i + 1}. ${detail.reason} - increment: ${detail.increment}, nesting: ${detail.nesting}`);
    });
}