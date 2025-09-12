/**
 * @fileoverview Simple Test Utilities (No VS Code API Dependencies)
 *
 * This module provides basic utilities for testing the core logic
 * of the code complexity extension without requiring VS Code APIs.
 */

/**
 * Sample C# code snippets for testing.
 */
export const SampleCSharpCode = {
  /**
   * Simple method with no complexity
   */
  SIMPLE_METHOD: `
        public class Test {
            public int Add(int a, int b) {
                return a + b;
            }
        }
    `,

  /**
   * Method with single if statement (complexity = 1)
   */
  SINGLE_IF: `
        public class Test {
            public int Max(int a, int b) {
                if (a > b) {
                    return a;
                }
                return b;
            }
        }
    `,

  /**
   * Method with nested control structures (high complexity)
   */
  NESTED_COMPLEX: `
        public class Test {
            public void ComplexMethod(List<int> numbers, bool flag) {
                if (numbers != null && numbers.Count > 0) {
                    foreach (var number in numbers) {
                        if (number > 0) {
                            for (int i = 0; i < number; i++) {
                                if (i % 2 == 0 || flag) {
                                    try {
                                        var result = 100 / i;
                                        if (result > 10) {
                                            continue;
                                        }
                                    }
                                    catch (DivideByZeroException) {
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    `,

  /**
   * Method with logical operators
   */
  LOGICAL_OPERATORS: `
        public class Test {
            public bool ComplexCondition(bool a, bool b, bool c) {
                return a && b || c;
            }
        }
    `,

  /**
   * Method with try-catch blocks
   */
  TRY_CATCH: `
        public class Test {
            public void RiskyOperation() {
                try {
                    // risky code
                }
                catch (ArgumentException ex) {
                    // handle argument exception
                }
                catch (InvalidOperationException ex) {
                    // handle invalid operation
                }
            }
        }
    `,

  /**
   * Multiple methods with different complexities
   */
  MULTIPLE_METHODS: `
        public class Calculator {
            public int Add(int a, int b) {
                return a + b;
            }

            public int Divide(int a, int b) {
                if (b == 0) {
                    throw new ArgumentException("Division by zero");
                }
                return a / b;
            }

            public string ProcessNumbers(List<int> numbers) {
                if (numbers == null || numbers.Count == 0) {
                    return "Empty";
                }

                foreach (var number in numbers) {
                    if (number < 0) {
                        continue;
                    }
                }

                return "Processed";
            }
        }
    `,

  /**
   * Malformed C# code for error testing
   */
  MALFORMED: `
        public class Test {
            public void Method() {
                if (true {  // Missing closing parenthesis
                    return;
                }
            }
        }
    `,

  /**
   * Empty class
   */
  EMPTY_CLASS: `
        public class EmptyClass {
        }
    `,

  /**
   * Abstract and interface methods
   */
  ABSTRACT_INTERFACE: `
        public abstract class AbstractTest {
            public abstract void AbstractMethod();

            public void ConcreteMethod() {
                if (true) {
                    return;
                }
            }
        }

        public interface ITest {
            void InterfaceMethod();
        }
    `,

  /**
   * Expression-bodied methods
   */
  EXPRESSION_BODIED: `
        public class Test {
            public int ExpressionMethod(int x) => x > 0 ? x : -x;
        }
    `,
};

/**
 * Validates that a function complexity object has the expected structure.
 *
 * @param complexity - The function complexity to validate
 * @param expectedName - Expected function name (optional)
 * @param expectedComplexity - Expected complexity score (optional)
 */
export function validateFunctionComplexity(
  complexity: any,
  expectedName?: string,
  expectedComplexity?: number
): void {
  if (typeof complexity.name !== "string") {
    throw new Error("Function complexity name must be a string");
  }
  if (typeof complexity.complexity !== "number") {
    throw new Error("Function complexity must be a number");
  }
  if (!Array.isArray(complexity.details)) {
    throw new Error("Function complexity details must be an array");
  }
  if (typeof complexity.startLine !== "number") {
    throw new Error("Function startLine must be a number");
  }
  if (typeof complexity.endLine !== "number") {
    throw new Error("Function endLine must be a number");
  }
  if (typeof complexity.startColumn !== "number") {
    throw new Error("Function startColumn must be a number");
  }
  if (typeof complexity.endColumn !== "number") {
    throw new Error("Function endColumn must be a number");
  }

  if (expectedName && complexity.name !== expectedName) {
    throw new Error(
      `Expected function name '${expectedName}', got '${complexity.name}'`
    );
  }
  if (
    expectedComplexity !== undefined &&
    complexity.complexity !== expectedComplexity
  ) {
    throw new Error(
      `Expected complexity ${expectedComplexity}, got ${complexity.complexity}`
    );
  }

  // Validate details
  complexity.details.forEach((detail: any, index: number) => {
    if (typeof detail.increment !== "number" || detail.increment <= 0) {
      throw new Error(`Detail ${index} increment must be a positive number`);
    }
    if (typeof detail.reason !== "string" || detail.reason.length === 0) {
      throw new Error(`Detail ${index} reason must be a non-empty string`);
    }
    if (typeof detail.line !== "number" || detail.line < 0) {
      throw new Error(`Detail ${index} line must be a non-negative number`);
    }
    if (typeof detail.column !== "number" || detail.column < 0) {
      throw new Error(`Detail ${index} column must be a non-negative number`);
    }
    if (typeof detail.nesting !== "number" || detail.nesting < 0) {
      throw new Error(`Detail ${index} nesting must be a non-negative number`);
    }
  });
}
