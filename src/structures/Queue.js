
class QueueNode {
  constructor(song) {
    this.song = song;
    this.next = null;
  }
}

class Queue {
  constructor() {
    this.front = null;
    this.rear = null;
    this.length = 0;
  }

  // Add song at the rear
  enqueue(song) {
    const newNode = new QueueNode(song);

    if (this.isEmpty()) {
      this.front = newNode;
      this.rear = newNode;
    } else {
      this.rear.next = newNode;
      this.rear = newNode;
    }

    this.length++;
  }

  // Remove song from the front
  dequeue() {
    if (this.isEmpty()) return null;

    const removedSong = this.front.song;
    this.front = this.front.next;

    if (this.front === null) {
      this.rear = null;
    }

    this.length--;
    return removedSong;
  }

  // See the next song without removing it
  peek() {
    return this.isEmpty() ? null : this.front.song;
  }

  isEmpty() {
    return this.length === 0;
  }

  size() {
    return this.length;
  }

  getAll() {
    const songs = [];
    let current = this.front;

    while (current !== null) {
      songs.push(current.song);
      current = current.next;
    }

    return songs;
  }
}

export default Queue;
