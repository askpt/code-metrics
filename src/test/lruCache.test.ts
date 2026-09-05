/**
 * @fileoverview Tests for LruCache
 *
 * This file contains unit tests for the bounded LRU cache utility used
 * across the extension's analysis and exclude-pattern caches.
 */

import * as assert from "assert";
import { LruCache } from "../lruCache";

suite("LruCache Tests", () => {
  test("get returns undefined for missing key", () => {
    const cache = new LruCache<string, number>(2);
    assert.strictEqual(cache.get("missing"), undefined);
  });

  test("set and get round-trip a value", () => {
    const cache = new LruCache<string, number>(2);
    cache.set("a", 1);
    assert.strictEqual(cache.get("a"), 1);
  });

  test("size reflects number of stored entries", () => {
    const cache = new LruCache<string, number>(3);
    assert.strictEqual(cache.size, 0);
    cache.set("a", 1);
    cache.set("b", 2);
    assert.strictEqual(cache.size, 2);
  });

  test("peek does not refresh LRU position", () => {
    const cache = new LruCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    // Peeking "a" should NOT protect it from eviction.
    assert.strictEqual(cache.peek("a"), 1);
    cache.set("c", 3);
    assert.strictEqual(cache.peek("a"), undefined);
    assert.strictEqual(cache.peek("b"), 2);
    assert.strictEqual(cache.peek("c"), 3);
  });

  test("get refreshes LRU position so the entry survives eviction", () => {
    const cache = new LruCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    // Touching "a" via get() should move it to most-recently-used.
    assert.strictEqual(cache.get("a"), 1);
    cache.set("c", 3);
    // "b" was least-recently-used and should have been evicted instead of "a".
    assert.strictEqual(cache.peek("b"), undefined);
    assert.strictEqual(cache.peek("a"), 1);
    assert.strictEqual(cache.peek("c"), 3);
  });

  test("set evicts the oldest entry once maxSize is exceeded", () => {
    const cache = new LruCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    assert.strictEqual(cache.size, 2);
    assert.strictEqual(cache.peek("a"), undefined);
    assert.strictEqual(cache.peek("b"), 2);
    assert.strictEqual(cache.peek("c"), 3);
  });

  test("set on an existing key updates the value without evicting others", () => {
    const cache = new LruCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("a", 100);
    assert.strictEqual(cache.size, 2);
    assert.strictEqual(cache.peek("a"), 100);
    assert.strictEqual(cache.peek("b"), 2);
  });

  test("delete removes an entry", () => {
    const cache = new LruCache<string, number>(2);
    cache.set("a", 1);
    cache.delete("a");
    assert.strictEqual(cache.peek("a"), undefined);
    assert.strictEqual(cache.size, 0);
  });

  test("delete on a missing key is a no-op", () => {
    const cache = new LruCache<string, number>(2);
    cache.set("a", 1);
    cache.delete("missing");
    assert.strictEqual(cache.size, 1);
  });

  test("deleteWhere removes only matching entries", () => {
    const cache = new LruCache<string, number>(5);
    cache.set("keep1", 1);
    cache.set("drop1", 2);
    cache.set("keep2", 3);
    cache.set("drop2", 4);
    cache.deleteWhere((key) => key.startsWith("drop"));
    assert.strictEqual(cache.size, 2);
    assert.strictEqual(cache.peek("keep1"), 1);
    assert.strictEqual(cache.peek("keep2"), 3);
    assert.strictEqual(cache.peek("drop1"), undefined);
    assert.strictEqual(cache.peek("drop2"), undefined);
  });

  test("clear removes all entries", () => {
    const cache = new LruCache<string, number>(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.clear();
    assert.strictEqual(cache.size, 0);
    assert.strictEqual(cache.peek("a"), undefined);
    assert.strictEqual(cache.peek("b"), undefined);
  });
});
