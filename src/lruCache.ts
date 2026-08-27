/**
 * @fileoverview A minimal bounded LRU (least-recently-used) cache.
 *
 * Backed by a `Map`, which preserves insertion order in JavaScript. On every
 * `get` hit the entry is re-inserted so it moves to the end (most-recently-used
 * position); when `set` would exceed `maxSize`, the oldest entry (first key in
 * iteration order) is evicted. This is the exact get/refresh/evict pattern that
 * was previously hand-rolled at several call sites across the extension.
 */
export class LruCache<K, V> {
  private readonly map = new Map<K, V>();

  public constructor(private readonly maxSize: number) {}

  /** Number of entries currently stored. */
  public get size(): number {
    return this.map.size;
  }

  /** Returns the value for `key` without refreshing its LRU position, or `undefined` if absent. */
  public peek(key: K): V | undefined {
    return this.map.get(key);
  }

  /** Returns the value for `key`, refreshing it to most-recently-used, or `undefined` if absent. */
  public get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value !== undefined) {
      this.map.delete(key);
      this.map.set(key, value);
    }
    return value;
  }

  /** Inserts or updates `key`/`value`, refreshing its LRU position and evicting the oldest entry if full. */
  public set(key: K, value: V): void {
    const replacedExisting = this.map.delete(key);
    if (!replacedExisting && this.map.size >= this.maxSize) {
      // Evict the least-recently-used entry (first key in insertion order).
      const oldestKey = this.map.keys().next().value as K;
      this.map.delete(oldestKey);
    }
    this.map.set(key, value);
  }

  /** Removes the entry for `key`, if present. */
  public delete(key: K): void {
    this.map.delete(key);
  }

  /** Removes all entries whose key satisfies `predicate`. */
  public deleteWhere(predicate: (key: K) => boolean): void {
    for (const key of this.map.keys()) {
      if (predicate(key)) {
        this.map.delete(key);
      }
    }
  }

  /** Removes all entries. */
  public clear(): void {
    this.map.clear();
  }
}
