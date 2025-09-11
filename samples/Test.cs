using System;
using System.Collections.Generic;
using System.Linq;

namespace ComplexityTest
{
    public class Calculator
    {
        public int Add(int a, int b)
        {
            return a + b;
        }

        public int Subtract(int a, int b)
        {
            if (a < b)
            {
                throw new ArgumentException("First argument must be greater than second.");
            }
            if (b == 0)
            {
                throw new ArgumentException("Second argument must not be zero.");
            }
            if (a == 0)
            {
                throw new ArgumentException("First argument must not be zero.");
            }

            foreach (int i in Enumerable.Range(0, b))
            {
                if (i % 2 == 0)
                {
                    a -= i;
                    if (a < 0)
                    {
                        a = 0;
                    }
                }
                else
                {
                    a += i;
                }
            }

            return a - b;
        }

        public string ProcessData(List<int> numbers, bool includeNegatives)
        {
            var result = new List<string>();
            
            foreach (var number in numbers)
            {
                if (number > 0)
                {
                    result.Add(number.ToString());
                }
                else if (includeNegatives && number < 0)
                {
                    result.Add($"({Math.Abs(number)})");
                }
                else
                {
                    // Skip zero and negatives when not included
                    continue;
                }
            }

            if (result.Count > 10)
            {
                return string.Join(", ", result.Take(10)) + "...";
            }
            else if (result.Count == 0)
            {
                return "No valid numbers";
            }
            else
            {
                return string.Join(", ", result);
            }
        }

        public bool IsComplexCondition(int value, bool flag1, bool flag2)
        {
            if ((value > 10 && flag1) || (value < 0 && flag2))
            {
                for (int i = 0; i < value; i++)
                {
                    if (i % 2 == 0 && i % 3 == 0)
                    {
                        try
                        {
                            var result = 100 / i;
                            if (result > 50)
                            {
                                return true;
                            }
                        }
                        catch (DivideByZeroException)
                        {
                            return false;
                        }
                    }
                }
            }
            
            return false;
        }
    }
}