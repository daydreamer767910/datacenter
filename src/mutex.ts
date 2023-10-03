interface IMutex {
  acquire: () => Promise<void>; // 不断轮询直到获取锁为止
  release: () => void; // 释放锁
}

class SpinMutex implements IMutex {
  private _locked = false;
  acquire() {
    return new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        if (!this._locked) {
          this._locked = true;
          clearInterval(timer);
          resolve();
        }
      }, 0);
    });
  }
  release() {
    this._locked = false;
  }
}

class Mutex {
  private isLocked = false;
  private queue: (() => void)[] = [];

  async lock(timeoutMillis = 0): Promise<boolean> {
    if (!this.isLocked) {
      this.isLocked = true;
      return true;
    }

    if (timeoutMillis <= 0) {
      return false;
    }

    return new Promise<boolean>((resolve) => {
      const timeoutId = setTimeout(() => {
        this.queue = this.queue.filter((item) => item !== penddingTsk);
        resolve(false);
      }, timeoutMillis);
      const penddingTsk = () => {
        clearTimeout(timeoutId);
        resolve(true);
      };
      this.queue.push(penddingTsk);
    });
  }

  unlock(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) {
        next();
      }
    } else {
      this.isLocked = false;
    }
  }
}

class Semaphore {
  //private static _id = 0;
  //private id: number;
  private count: number;
  private waitQueue: any[];
  constructor(initialCount: number) {
    //this.id = Semaphore._id++;
    this.count = initialCount;
    this.waitQueue = [];
  }

  async acquire(timeout: number) {
    /*console.log(
      `sem[${this.id}] count[${this.count}] queuesize[${this.waitQueue.length}]`
    );*/
    if (this.count > 0) {
      this.count--;
      return Promise.resolve();
    } else {
      return new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          this.waitQueue = this.waitQueue.filter(
            (waiter) => waiter !== waitTask
          );
          reject("Semaphore acquisition timed out");
        }, timeout);
        //console.log(`sem[${this.id}] push resolve`);
        const waitTask = () => {
          //console.log(`waitTask[${timeoutId} , ${this.count}] `);
          clearTimeout(timeoutId);
          this.count--;
          resolve();
        };
        this.waitQueue.push(waitTask);
      });
    }
  }

  release() {
    this.count++;
    const next = this.waitQueue.shift();
    if (next) {
      //console.log("shift resolve");
      next();
    }
  }
}

export { SpinMutex, Mutex, Semaphore };
