import { MessageQueue, IMemoryMessage } from "./memmsgq";
import { GetLogger } from "./logger";

abstract class AppBase<T extends IMemoryMessage> {
  protected logger: any;
  protected messageQueue: MessageQueue<T>;
  private msgID: number;

  constructor(queueSize = 50) {
    this.messageQueue = new MessageQueue<T>(queueSize);
    this.msgID = 0;
  }

  protected log(level: string, message: string, ...meta: any[]) {
    this.logger?.log(level, message, ...meta);
  }

  initialize() {
    this.logger = GetLogger("app");
    this.run();
  }

  public async postMessage(msg: Partial<T>) {
    const completeMsg = {
      id: this.msgID++,
      ...msg,
    } as T;

    const result = await this.messageQueue.sendMsg([completeMsg]);
    this.log("debug", "Message sent", completeMsg);
    return result;
  }

  private async run() {
    for (;;) {
      const recvMsgs: T[] = new Array<T>(5);
      const receivedCount = await this.messageQueue.recvMsg(recvMsgs, 3600000);

      for (let i = 0; i < receivedCount; i++) {
        const message = recvMsgs[i];
        this.log("debug", "Processing message", message);
        await this.onMessage(message);
      }
    }
  }

  protected abstract onMessage(message: T): Promise<void>;
}

export default AppBase;
