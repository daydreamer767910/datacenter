import AppBase from "./appbase";
import { IMemoryMessage } from "./memmsgq";
import { Semaphore } from "./mutex";
import * as path from "path";
import { paidan, filterBills, client, mk_kttdir_daily } from "./transaction";
import ffi from "ffi-napi";
import fs from 'fs';
import {objDatabase} from './memdatabase'

interface CmdMsg extends IMemoryMessage {
  cmd: string;
  opt: string[];
}

enum CommandType {
  p = "paidan",
  h = "huidan",
  c = "client",
  f = "filter",
  k = "prebill",
  t = "test",
  l = "loop",
}

class KttApp extends AppBase<CmdMsg> {
  private semaphore: Semaphore;
  constructor(queueSize: number) {
    super(queueSize);
    this.semaphore = new Semaphore(0);
  }
  initialize() {
    super.initialize(); // 调用基类的初始化逻辑
    this.log("debug", "KTT App initialized and start running");
  }
  protected async onMessage(message: CmdMsg): Promise<void> {
    const { cmd, opt } = message;
    this.log("info", `Received command: ${cmd}, options: ${opt.join(", ")}`);

    switch (cmd) {
      case CommandType.k:
        await mk_kttdir_daily(opt[0]);
        break;
      case CommandType.p:
        await this.handlePaidan(opt);
        break;
      case CommandType.h:
        await this.handleFilterBills(opt);
        break;
      case CommandType.c:
        await client(
          path.resolve(__dirname, opt[0]),
          path.resolve(__dirname, opt[1])
        );
        break;
      case CommandType.f:
        await filterBills(
          path.resolve(__dirname, opt[0]),
          path.resolve(__dirname, opt[1]),
          true
        );
        break;
      case CommandType.t:
        await this.runTest();
        break;
      case CommandType.l:
        await this.loop(Number(opt[0]));
        break;
      default:
        this.log("error", `Unsupported command: ${cmd}`);
    }
  }

  private async handlePaidan(opt: string[]) {
    if (opt.length < 2) {
      await mk_kttdir_daily("paidan");
      return await paidan();
    }
    return await paidan(
      path.resolve(__dirname, opt[0]),
      path.resolve(__dirname, opt[1])
    );
  }

  private async handleFilterBills(opt: string[]) {
    if (opt.length < 2) {
      await mk_kttdir_daily("huidan");
      return await filterBills();
    }
    return await filterBills(
      path.resolve(__dirname, opt[0]),
      path.resolve(__dirname, opt[1]),
      false
    );
  }

  private async loop(counter: number) {
    while (counter > 0) {
      this.semaphore.release();
      counter--;
    }
  }

  private async runTest() {
    async function criticalSection(app: KttApp, num: number) {
      //Logger.log("info", "----------------criticalSection is called %d", num);
      await app.semaphore
        .acquire(10000)
        .then(async () => {
          // 临界区代码
          app.log("info", "Entering critical section %d", num);
          await new Promise((resolve) => setTimeout(resolve, 2000)); // 模拟耗时操作
          app.log("info", "Exiting critical section %d", num);
        })
        .catch((reason: any) => {
          console.log(reason);
        });

      //Logger.log("info", "=================criticalSection end %d", num);
    }

    // 测试互斥锁
    //let profiler = Logger().startTimer();
    //sem.release();
    criticalSection(this, 1);
    //sem.release();
    //Logger.log("info", "sem release");
    criticalSection(this, 2);
    criticalSection(this, 3);

    const fileName = path.resolve(__dirname, "../lib/libmylib.so");
    console.log(`starting to load : ${fileName}`);
    try {
      const conn = ffi.DynamicLibrary(
        fileName,
        ffi.DynamicLibrary.FLAGS.RTLD_LAZY
      );
      console.log(
        "load dll with add[%s] method ok",
        conn.get("add").hexAddress()
      );

      const mylib = ffi.Library(fileName, {
        add: ["int", ["int", "int"]],
      });

      // 调用共享库中的函数
      const result = mylib.add(5, 10);
      console.log("%s(5,10) Result:", Object.keys(mylib), result);
    } catch (err) {
      console.log("Not loaded: " + fileName + err);
    }
    
      // 示例用法
    (async () => {
      const configPath = "./testtbl.json"
      const rawData = fs.readFileSync(configPath, 'utf-8');
      const tableConfig = JSON.parse(rawData);
      
      objDatabase.initialize(tableConfig);
      
      })();

  }
}
export const App = new KttApp(50);
