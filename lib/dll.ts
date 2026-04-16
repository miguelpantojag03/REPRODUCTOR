/**
 * Node class for the Doubly Linked List
 */
export class DLLNode<T> {
  value: T;
  next: DLLNode<T> | null = null;
  prev: DLLNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

/**
 * Doubly Linked List implementation for the Music Player Workshop
 */
export class DoublyLinkedList<T> {
  head: DLLNode<T> | null = null;
  tail: DLLNode<T> | null = null;
  size: number = 0;

  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Adds a value to the beginning of the list
   */
  addStart(value: T): DLLNode<T> {
    return this.addFirst(value);
  }

  /**
   * Adds a value to the end of the list
   */
  addEnd(value: T): DLLNode<T> {
    return this.addLast(value);
  }

  /**
   * Adds a value at a specific position (0-indexed)
   */
  addAtPosition(index: number, value: T): DLLNode<T> | null {
    return this.addAt(index, value);
  }
  addFirst(value: T): DLLNode<T> {
    const newNode = new DLLNode(value);
    if (!this.head) {
      this.head = this.tail = newNode;
    } else {
      newNode.next = this.head;
      this.head.prev = newNode;
      this.head = newNode;
    }
    this.size++;
    return newNode;
  }

  /**
   * Adds a value to the end of the list
   */
  addLast(value: T): DLLNode<T> {
    const newNode = new DLLNode(value);
    if (!this.tail) {
      this.head = this.tail = newNode;
    } else {
      newNode.prev = this.tail;
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this.size++;
    return newNode;
  }

  /**
   * Adds a value at a specific position (0-indexed)
   */
  addAt(index: number, value: T): DLLNode<T> | null {
    if (index < 0 || index > this.size) return null;
    if (index === 0) return this.addFirst(value);
    if (index === this.size) return this.addLast(value);

    const newNode = new DLLNode(value);
    let current = this.head;
    for (let i = 0; i < index; i++) {
      current = current!.next;
    }

    // Insert before current
    newNode.next = current;
    newNode.prev = current!.prev;
    current!.prev!.next = newNode;
    current!.prev = newNode;

    this.size++;
    return newNode;
  }

  /**
   * Removes a node based on a predicate
   */
  remove(predicate: (value: T) => boolean): T | null {
    let current = this.head;
    while (current) {
      if (predicate(current.value)) {
        if (current === this.head) {
          this.head = current.next;
          if (this.head) this.head.prev = null;
        } else if (current === this.tail) {
          this.tail = current.prev;
          if (this.tail) this.tail.next = null;
        } else {
          current.prev!.next = current.next;
          current.next!.prev = current.prev;
        }
        this.size--;
        return current.value;
      }
      current = current.next;
    }
    return null;
  }

  /**
   * Finds a node based on a predicate
   */
  find(predicate: (value: T) => boolean): DLLNode<T> | null {
    let current = this.head;
    while (current) {
      if (predicate(current.value)) return current;
      current = current.next;
    }
    return null;
  }

  /**
   * Moves a node to a new position
   */
  move(predicate: (value: T) => boolean, toIndex: number): boolean {
    const node = this.find(predicate);
    if (!node) return false;

    // Remove it first
    const val = this.remove(predicate);
    if (!val) return false;

    // Insert it at new index
    this.addAt(toIndex, val);
    return true;
  }

  /**
   * Converts the list to an array
   */
  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }

  /**
   * Static method to create a DLL from an array
   */
  static fromArray<T>(items: T[]): DoublyLinkedList<T> {
    const list = new DoublyLinkedList<T>();
    for (const item of items) {
      list.addLast(item);
    }
    return list;
  }
}
