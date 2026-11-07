class HashMap {
  constructor() {
    this.buckets = new Array(50);
    this.capacity = 50;
    this.length = 0;
  }

  // Generate hash index from key
  hash(key) {
    let hashCode = 0;

    for (let i = 0; i < key.length; i++) {
      hashCode = (hashCode * 31 + key.charCodeAt(i)) % this.capacity;
    }

    return hashCode;
  }

  // Insert or update a key-value pair
  set(key, value) {
    const index = this.hash(key);

    if (!this.buckets[index]) {
      this.buckets[index] = [];
    }

    const bucket = this.buckets[index];

    // Check if key already exists
    for (let pair of bucket) {
      if (pair.key === key) {
        pair.value = value;
        return;
      }
    }

    bucket.push({ key, value });
    this.length++;
  }

  // Retrieve value using key
  get(key) {
    const index = this.hash(key);
    const bucket = this.buckets[index];

    if (!bucket) return undefined;

    for (let pair of bucket) {
      if (pair.key === key) {
        return pair.value;
      }
    }

    return undefined;
  }

  // Check whether key exists
  has(key) {
    const index = this.hash(key);
    const bucket = this.buckets[index];

    if (!bucket) return false;

    return bucket.some((pair) => pair.key === key);
  }

  // Remove a key-value pair
  remove(key) {
    const index = this.hash(key);
    const bucket = this.buckets[index];

    if (!bucket) return false;

    const pairIndex = bucket.findIndex(
      (pair) => pair.key === key
    );

    if (pairIndex === -1) return false;

    bucket.splice(pairIndex, 1);
    this.length--;

    return true;
  }

  // Return total number of entries
  size() {
    return this.length;
  }

  // Return all key-value pairs
  getAll() {
    const entries = [];

    for (let bucket of this.buckets) {
      if (bucket) {
        entries.push(...bucket);
      }
    }

    return entries;
  }
}

export default HashMap;