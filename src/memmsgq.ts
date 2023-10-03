import { Mutex, Semaphore } from "./mutex";

class CircularBuffer<T> {
  private capacity: number;
  private buffer: T[];
  private size = 0;
  private head = 0;
  private tail = 0;
  private mutex = new Mutex();
  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  async enqueue(item: T, timeout = 0) {
    const bRet = await this.mutex.lock(timeout);
    if (bRet) {
      if (this.size === this.capacity) {
        // 缓冲区已满，覆盖旧数据
        this.head = (this.head + 1) % this.capacity;
        this.size--;
      }

      this.buffer[this.tail] = item;
      this.tail = (this.tail + 1) % this.capacity;
      this.size++;
    }
    this.mutex.unlock();
  }

  async dequeue(timeout = 0): Promise<T | undefined> {
    const bRet = await this.mutex.lock(timeout);
    let item = undefined;
    if (bRet) {
      if (this.size === 0) {
        //console.log("Buffer is empty. Nothing to dequeue.");
      } else {
        item = this.buffer[this.head];
        this.head = (this.head + 1) % this.capacity;
        this.size--;
      }
    }
    this.mutex.unlock();
    return item;
  }

  getSize(): number {
    return this.size;
  }

  getCapacity(): number {
    return this.capacity;
  }
}

class MessageQueue<T> {
  private buffer: CircularBuffer<T>;
  private semaphore = new Semaphore(0);
  constructor(capacity: number) {
    this.buffer = new CircularBuffer<T>(capacity);
  }

  async sendMsg(msg: T[], timeout = 0) {
    const toSendSize =
      msg.length > this.buffer.getCapacity()
        ? this.buffer.getCapacity()
        : msg.length;
    for (let i = 0; i < toSendSize; i++) {
      await this.buffer.enqueue(msg[i], timeout);
    }
    this.semaphore.release();
    return this.buffer.getSize();
  }

  async recvMsg(msg: T[], timeout: number) {
    let size = 0;
    await this.semaphore
      .acquire(timeout)
      .then(async () => {
        //console.log("--------------------------------");
        const toRecvSize =
          msg.length < this.buffer.getSize()
            ? msg.length
            : this.buffer.getSize();
        while (size < toRecvSize) {
          msg[size++] = await this.buffer.dequeue();
        }
        //console.log("===============================");
      })
      .catch(() => {
        //console.log(reason);
      });

    return size;
  }

  getSize(): number {
    return this.buffer.getSize();
  }

  getCapacity(): number {
    return this.buffer.getCapacity();
  }
}

export { MessageQueue };
