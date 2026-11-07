
class Stack {
  constructor() {
    this.items = [];
  }

  push(song) {
    this.items.push(song);
  }

  pop() {
    if (this.isEmpty()) {
      return null;
    }

    return this.items.pop();
  }

  peek() {
    if (this.isEmpty()) {
      return null;
    }

    return this.items[this.items.length - 1];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  getAll() {
    return [...this.items].reverse();
  }

  size() {
    return this.items.length;
  }
}

export default Stack;
