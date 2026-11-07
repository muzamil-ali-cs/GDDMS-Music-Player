
class Node {
  constructor(data) {
    this.data = data;
    this.prev = null;
    this.next = null;
  }
}

class DoublyLinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
    this.current = null;
    this.size = 0;
  }

  append(data) {
    const newNode = new Node(data);

    if (this.head === null) {
      this.head = newNode;
      this.tail = newNode;
      this.current = newNode;
    } else {
      newNode.prev = this.tail;
      this.tail.next = newNode;
      this.tail = newNode;
    }

    this.size++;
    return newNode;
  }

  next() {
  if (!this.current || !this.current.next) {
    return null;
  }

  this.current = this.current.next;
  return this.current;
}

  previous() {
  if (!this.current || !this.current.prev) {
    return null;
  }

  this.current = this.current.prev;
  return this.current;
}

  select(index) {
    if (index < 0 || index >= this.size) {
      return null;
    }

    let temp = this.head;

    for (let i = 0; i < index; i++) {
      temp = temp.next;
    }

    this.current = temp;
    return this.current;
  }

  getCurrent() {
    return this.current ? this.current.data : null;
  }

  getAll() {
    const songs = [];
    let temp = this.head;

    while (temp !== null) {
      songs.push(temp.data);
      temp = temp.next;
    }

    return songs;
  }
}

export default DoublyLinkedList;
