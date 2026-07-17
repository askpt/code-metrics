import java.util.List;
import java.util.function.Predicate;

// ── Records (Java 16+) ──────────────────────────────────────────────────────
// Records automatically generate equals, hashCode, toString, and accessors.
// Compact constructors are also analysed (complexity: 1 for the if).
record Range(int start, int end) {
    Range {
        if (start > end) {
            throw new IllegalArgumentException("start must be <= end");
        }
    }

    boolean contains(int value) {
        return value >= start && value <= end;
    }
}

// ── Enums with methods ──────────────────────────────────────────────────────
// Enum methods are shown as <EnumName>.<methodName> in CodeLens.
enum Direction {
    NORTH, SOUTH, EAST, WEST;

    public boolean isOpposite(Direction other) {
        if (this == NORTH && other == SOUTH) { return true; }
        if (this == SOUTH && other == NORTH) { return true; }
        if (this == EAST  && other == WEST)  { return true; }
        if (this == WEST  && other == EAST)  { return true; }
        return false;
    }
}

// ── Generic class ───────────────────────────────────────────────────────────
// Generic type parameters are handled transparently — complexity is the same
// as for a non-generic equivalent method.
class Container<T> {
    private final T value;

    Container(T value) { this.value = value; }

    public <U extends Comparable<U>> U max(U a, U b) {
        return a.compareTo(b) >= 0 ? a : b;
    }

    public static <T> List<T> filterList(List<T> list, Predicate<T> pred) {
        return list.stream().filter(pred).toList();
    }
}

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
