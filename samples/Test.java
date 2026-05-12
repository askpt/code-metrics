import java.util.List;

public class SampleJava {

    private int value;

    public SampleJava(int value) {
        this.value = value;
    }

    // Simple method — complexity 0
    public int getValue() {
        return value;
    }

    // Moderate complexity — if + logical operators
    public String classify(int n) {
        if (n > 0 && n < 10) {
            return "small positive";
        } else if (n >= 10 && n < 100) {
            return "medium positive";
        } else if (n < 0) {
            return "negative";
        }
        return "zero or large";
    }

    // Higher complexity — nested loops and conditionals
    public int processMatrix(int[][] matrix) {
        int sum = 0;
        for (int[] row : matrix) {
            for (int cell : row) {
                if (cell > 0) {
                    sum += cell;
                } else if (cell < 0) {
                    sum -= cell;
                }
            }
        }
        return sum;
    }

    // Exception handling
    public int parse(String s) {
        try {
            return Integer.parseInt(s);
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    // Lambda and ternary
    public void printPositives(List<Integer> numbers) {
        numbers.stream()
            .filter(n -> n > 0)
            .forEach(n -> System.out.println(n > 10 ? "big" : "small"));
    }

    // Switch
    public String dayName(int day) {
        switch (day) {
            case 1: return "Monday";
            case 2: return "Tuesday";
            case 3: return "Wednesday";
            case 4: return "Thursday";
            case 5: return "Friday";
            default: return "Weekend";
        }
    }
}
