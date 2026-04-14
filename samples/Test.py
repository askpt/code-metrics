"""
Sample Python file for testing Cognitive Complexity metrics.
Each function below demonstrates different complexity-contributing constructs.
"""


def simple_add(a: int, b: int) -> int:
    """No control flow — complexity 0."""
    return a + b


def max_value(a: int, b: int) -> int:
    """Single if — complexity 1."""
    if a > b:
        return a
    return b


def classify(value: int) -> str:
    """if / elif / else chain — complexity 3."""
    if value > 100:
        return "large"
    elif value > 50:
        return "medium"
    elif value > 0:
        return "small"
    else:
        return "zero or negative"


def process_items(items: list, include_negatives: bool) -> list:
    """Nested control flow with boolean operators — higher complexity."""
    result = []
    for item in items:
        if item > 0:
            result.append(item)
        elif include_negatives and item < 0:
            result.append(-item)
        else:
            continue

    if len(result) > 10:
        return result[:10]
    elif len(result) == 0:
        return []

    return result


def safe_divide(a: float, b: float) -> float:
    """try/except block — complexity increments for except."""
    try:
        return a / b
    except ZeroDivisionError:
        return 0.0
    except (TypeError, ValueError):
        return 0.0


def sum_positives(items: list) -> int:
    """List comprehension — structural complexity."""
    return sum(x for x in items if x > 0)


class Calculator:
    """Class with methods — each method analyzed independently."""

    def add(self, a: int, b: int) -> int:
        """Simple method — complexity 0."""
        return a + b

    def safe_sqrt(self, value: float) -> float:
        """Method with conditional expression — complexity 1."""
        return value ** 0.5 if value >= 0 else 0.0

    def compute(self, values: list, mode: str) -> float:
        """Complex method with nested control flow."""
        total = 0.0
        for v in values:
            if mode == "sum":
                total += v
            elif mode == "product":
                if total == 0.0:
                    total = 1.0
                total *= v
            else:
                continue
        return total
