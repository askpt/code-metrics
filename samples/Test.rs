// Sample Rust file for testing Code Metrics extension
// This file demonstrates various Rust constructs that affect cognitive complexity.

fn simple_function(x: i32) -> i32 {
    x + 1
}

fn function_with_if(x: i32) -> i32 {
    if x > 0 {
        x
    } else {
        0
    }
}

fn function_with_loop(n: i32) -> i32 {
    let mut sum = 0;
    for i in 0..n {
        sum += i;
    }
    sum
}

fn function_with_match(x: i32) -> &'static str {
    match x {
        0 => "zero",
        1..=9 => "single digit",
        _ => "large",
    }
}

fn complex_function(x: i32, y: i32) -> i32 {
    if x > 0 && y > 0 {
        for i in 0..x {
            if i % 2 == 0 || i == y {
                return i;
            }
        }
    } else if x < 0 {
        let mut n = x;
        while n < 0 {
            n += 1;
        }
        return n;
    }
    0
}

struct Calculator {
    value: i32,
}

impl Calculator {
    fn new(value: i32) -> Self {
        Calculator { value }
    }

    fn apply(&self, op: &str, operand: i32) -> i32 {
        match op {
            "add" => self.value + operand,
            "sub" => self.value - operand,
            "mul" => self.value * operand,
            _ => self.value,
        }
    }

    fn compute_series(&self, n: i32) -> i32 {
        let mut result = self.value;
        for i in 1..=n {
            if i % 3 == 0 && i % 5 == 0 {
                result += 15;
            } else if i % 3 == 0 {
                result += 3;
            } else if i % 5 == 0 {
                result += 5;
            }
        }
        result
    }
}
