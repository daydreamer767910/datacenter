import AppBase from "./appbase";
import { IMemoryMessage } from "./memmsgq";
import { Semaphore } from "./mutex";
import * as path from "path";
import { paidan, filterBills, client, mk_kttdir_daily } from "./transaction";
import ffi from "ffi-napi";
import ref from "ref-napi";
//import fs from 'fs';
//import {objDatabase} from './memdatabase'

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
    /*async function criticalSection(app: KttApp, num: number) {
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
    criticalSection(this, 3);*/
    const fileName = path.resolve(__dirname, "../lib/libmdb.so");
    try {
      // 定义库接口
      const mdbLib = ffi.Library(fileName, {
        mdb_init: ["void", ["string","string"]],
        mdb_stop: ["void", []],
        mdb_start: ["int", ["string", "int"]],
        mdb_reconnect: ["int", ["string", "int"]],
        mdb_recv: ["int", ["pointer", "int", "int"]],
        mdb_send: ["int", ["string", "int", "int"]],
      });

      // 初始化
      mdbLib.mdb_init("memdb", "oumass");

      // 启动连接
      const ip = "192.168.1.67";
      const port = 8900;
      const startResult = mdbLib.mdb_start(ip, port);
      if (startResult === 0) {
        console.log("Connection started successfully!");
      } else {
        console.error("Failed to start connection.");
      }
      const jsonConfig = {
        action: "create",
        name: "test",
        type: "table",
        columns: [
          { name: "id", type: "int", primaryKey: true },
          { name: "name", type: "string" },
          { name: "age", type: "int", defaultValue: 20 },
          { name: "addr", type: "string", defaultValue: "xxxx" },
          { name: "created_at", type: "time" },
        ],
      };
      const jsonStr = JSON.stringify(jsonConfig,null,1);
      let msgId = 1;
      const timeout = 5000;

      const sendResult = mdbLib.mdb_send(jsonStr, msgId, timeout);
      if (sendResult > 0) {
        console.log("Message sent successfully!");
      } else {
        console.error("Failed to send message.");
      }

      const BUFFER_SIZE = 1024 * 10;

      // 创建缓冲区
      const buffer = Buffer.alloc(BUFFER_SIZE);

      // 将 Buffer 声明为指针
      const bufferPtr = buffer as unknown as ref.Pointer<unknown>;

      const recvTimeout = 5000;

      // 调用 mdb_recv
      const recvResult = mdbLib.mdb_recv(bufferPtr, BUFFER_SIZE, recvTimeout);

      if (recvResult > 0) {
        const jsonResult = buffer.toString("utf8", 0, recvResult); // 提取接收的数据
        const receivedData = JSON.parse(jsonResult);
        console.log("Received data:", receivedData);
      } else if (recvResult === 0) {
        console.log("No data received within the timeout.");
      } else {
        console.error("Failed to receive data.");
      }

      interface Row {
        id: number;
        name: string;
        age: number;
        addr: string;
      }

      interface JsonData {
        action: string;
        name: string;
        rows: Row[];
      }

      const jsonData: JsonData = {
        action: "insert",
        name: "test",
        rows: [],
      };

      // 创建数据行
      for (let i = 0; i < 20; i++) {
        const row: Row = {
          id: i,
          name: `test name${i}`,
          age: 20 + i,
          addr: `street ${i}`,
        };
        jsonData.rows.push(row);
      }

      // 转换为 JSON 字符串
      const jsonConfig1 = JSON.stringify(jsonData, null, 1);
      msgId = 2;

      const sendResult1 = mdbLib.mdb_send(jsonConfig1, msgId, timeout);
      if (sendResult1 > 0) {
        console.log("Message sent successfully!");
      } else {
        console.error("Failed to send message.");
      }

      // 调用 mdb_recv
      const recvResult1 = mdbLib.mdb_recv(bufferPtr, BUFFER_SIZE, recvTimeout);

      if (recvResult1 > 0) {
        const jsonResult = buffer.toString("utf8", 0, recvResult1); // 提取接收的数据
        const receivedData = JSON.parse(jsonResult);
        console.log("Received data:", receivedData);
      } else if (recvResult1 === 0) {
        console.log("No data received within the timeout.");
      } else {
        console.error("Failed to receive data.");
      }

      const jsonConfig2 = {
        action: "count",
        name: "test",
      };
      // 转换为 JSON 字符串
      const data = JSON.stringify(jsonConfig2, null, 1);
      msgId = 3;

      const sendResult2 = mdbLib.mdb_send(data, msgId, timeout);
      if (sendResult2 > 0) {
        console.log("Message sent successfully!");
      } else {
        console.error("Failed to send message.");
      }

      // 调用 mdb_recv
      const recvResult2 = mdbLib.mdb_recv(bufferPtr, BUFFER_SIZE, recvTimeout);

      if (recvResult2 > 0) {
        const jsonResult = buffer.toString("utf8", 0, recvResult2); // 提取接收的数据
        const receivedData = JSON.parse(jsonResult);
        console.log("Received data:", JSON.stringify(receivedData, null, 2));
      } else if (recvResult2 === 0) {
        console.log("No data received within the timeout.");
      } else {
        console.error("Failed to receive data.");
      }
      // 停止并释放资源
      mdbLib.mdb_stop();
      console.log("Stopped and cleaned up.");
    } catch (err) {
      console.log("Not loaded: " + fileName + err);
    }
    /*
      // 示例用法
    (async () => {
      const configPath = "./testtbl.json"
      const rawData = fs.readFileSync(configPath, 'utf-8');
      const tableConfig = JSON.parse(rawData);
      
      objDatabase.initialize(tableConfig);
      
      })();*/
  }
}
export const App = new KttApp(50);
