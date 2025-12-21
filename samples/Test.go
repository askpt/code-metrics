// Sample Go file for Code Metrics extension testing
// This file demonstrates various complexity patterns in Go

package main

import (
	"fmt"
	"sync"
)

// Calculator is a simple struct for demonstrating method complexity
type Calculator struct {
	value int
}

// Add is a simple function with no complexity (complexity: 0)
func Add(a, b int) int {
	return a + b
}

// Subtract is a simple function with no complexity (complexity: 0)
func Subtract(a, b int) int {
	return a - b
}

// Max returns the maximum of two values (complexity: 1)
// Contains: 1 if statement
func Max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// Abs returns the absolute value (complexity: 1)
// Contains: 1 if statement
func Abs(value int) int {
	if value < 0 {
		return -value
	}
	return value
}

// ProcessData demonstrates moderate complexity (complexity: ~7)
// Contains: for loop, multiple if statements, logical operators
func ProcessData(numbers []int, includeNegatives bool) []string {
	result := make([]string, 0)

	for _, number := range numbers { // +1
		if number > 0 { // +1
			result = append(result, fmt.Sprintf("%d", number))
		} else if includeNegatives && number < 0 { // +1 for if, +1 for &&
			result = append(result, fmt.Sprintf("(%d)", -number))
		} else {
			continue // +1 (nested)
		}
	}

	if len(result) > 10 { // +1
		return result[:10]
	} else if len(result) == 0 { // +1
		return nil
	}

	return result
}

// IsComplexCondition demonstrates high complexity with nested control flow
// Contains: if with logical operators, for loop, nested if, try-catch equivalent
func IsComplexCondition(value int, flag1, flag2 bool) bool {
	if (value > 10 && flag1) || (value < 0 && flag2) { // +1 for if, +1 for &&, +1 for ||, +1 for &&
		for i := 0; i < value; i++ { // +1
			if i%2 == 0 && i%3 == 0 { // +1 for if, +1 for &&
				if 100/i > 50 { // +1
					return true
				}
			}
		}
	}

	return false
}

// SwitchExample demonstrates switch statement complexity (complexity: 1)
func SwitchExample(value int) string {
	switch value { // +1
	case 1:
		return "one"
	case 2:
		return "two"
	case 3:
		return "three"
	default:
		return "other"
	}
}

// TypeSwitchExample demonstrates type switch statement complexity (complexity: 1)
func TypeSwitchExample(value interface{}) string {
	switch value.(type) { // +1
	case int:
		return "integer"
	case string:
		return "string"
	case bool:
		return "boolean"
	default:
		return "unknown"
	}
}

// SelectExample demonstrates select statement for channel operations (complexity: 1)
func SelectExample(ch1, ch2 chan int, done chan bool) int {
	select { // +1
	case v := <-ch1:
		return v
	case v := <-ch2:
		return v
	case <-done:
		return -1
	}
}

// ConcurrentWorker demonstrates goroutines and select in a loop (complexity: 2)
func ConcurrentWorker(jobs <-chan int, results chan<- int, done chan bool) {
	for { // +1
		select { // +1
		case job := <-jobs:
			results <- job * 2
		case <-done:
			return
		}
	}
}

// SafeOperation demonstrates recover pattern (complexity: ~3)
// Contains: if statement, recover call
func SafeOperation() (err error) {
	defer func() {
		if r := recover(); r != nil { // +1 for if, +1 for recover
			err = fmt.Errorf("recovered from panic: %v", r)
		}
	}()

	// Do something that might panic
	panic("intentional panic for demonstration")
}

// Add method on Calculator (complexity: 0)
func (c Calculator) Add(a, b int) int {
	return a + b
}

// Increment method on Calculator pointer receiver (complexity: 1)
func (c *Calculator) Increment() {
	if c.value < 100 { // +1
		c.value++
	}
}

// Reset method on Calculator pointer receiver (complexity: 0)
func (c *Calculator) Reset() {
	c.value = 0
}

// NestedLoopsExample demonstrates deeply nested complexity
func NestedLoopsExample(matrix [][]int) int {
	sum := 0
	for i := 0; i < len(matrix); i++ { // +1
		for j := 0; j < len(matrix[i]); j++ { // +1
			if matrix[i][j] > 0 { // +1
				if matrix[i][j]%2 == 0 { // +1
					sum += matrix[i][j]
				}
			}
		}
	}
	return sum
}

// LabeledBreakExample demonstrates labeled break complexity (complexity: 4)
func LabeledBreakExample(items [][]int, target int) bool {
outer: // label
	for i := 0; i < len(items); i++ { // +1
		for j := 0; j < len(items[i]); j++ { // +1
			if items[i][j] == target { // +1
				break outer // +1 (labeled break)
			}
		}
	}
	return false
}

// GotoExample demonstrates goto statement complexity (complexity: 1)
func GotoExample(value int) string {
	if value < 0 {
		goto negative
	}
	return "positive or zero"

negative:
	return "negative"
}

// ClosureExample demonstrates closure complexity
func ClosureExample(items []int) []int {
	result := make([]int, 0)

	if len(items) > 0 { // +1
		// Nested closure adds complexity
		transform := func(x int) int { // +1 (nested func literal)
			if x < 0 { // +1
				return -x
			}
			return x
		}

		for _, item := range items { // +1
			result = append(result, transform(item))
		}
	}

	return result
}

// LogicalOperatorChain demonstrates multiple logical operators
func LogicalOperatorChain(a, b, c, d bool) bool {
	return a && b || c && d // +1 for &&, +1 for ||, +1 for &&
}

// MutexExample demonstrates sync.Mutex usage (no direct complexity impact)
func MutexExample(mu *sync.Mutex, value *int) {
	mu.Lock()
	defer mu.Unlock()

	if *value < 100 { // +1
		*value++
	}
}

// main function to demonstrate the extension
func main() {
	fmt.Println("Code Metrics Extension - Go Sample File")
	fmt.Println("This file contains various Go patterns for complexity analysis")

	// Simple function calls
	result := Add(5, 3)
	fmt.Printf("Add(5, 3) = %d\n", result)

	max := Max(10, 20)
	fmt.Printf("Max(10, 20) = %d\n", max)

	// Process data example
	numbers := []int{1, -2, 3, -4, 5, 0, 6, -7, 8, 9, 10, 11, 12}
	processed := ProcessData(numbers, true)
	fmt.Printf("ProcessData result: %v\n", processed)

	// Switch example
	switchResult := SwitchExample(2)
	fmt.Printf("SwitchExample(2) = %s\n", switchResult)
}
