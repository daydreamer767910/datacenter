import * as LOG from "./logger";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { Commsrv } from "./commsrv";
import { Websrv } from "./websrv";
//import { Mutex, Semaphore } from "./mutex";
import { Semaphore } from "./mutex";
import ffi from "ffi-napi";
import { IMemoryMessage, MessageQueue } from "./memmsgq";
import { paidan, filterBills, client, mk_kttdir_daily } from "./transaction";
import * as path from "path";

const Logger = {
  log: (level: string, message: string, ...meta: any[]) =>
    LOG.GetLogger("app")?.log(level, message, ...meta),
};

function initialize() {
  return new Promise<void>((resolve, reject) => {
    const envPath = path.resolve(__dirname, "../.env");
    // console.log(envPath);
    const result = dotenv.config({ path: envPath });
    if (result.error) {
      reject(result.error);
    }
    //console.log(result.parsed);
    const LogServices = ["app", "comm", "sys", "db"];
    LOG.Register(LogServices);

    Commsrv.initialize(Number(process.env.COMM_PORT));
    Websrv.initialize(Number(process.env.WEB_PORT));
    AppDataSource.initialize().then((datasource) => {
      if (datasource.isInitialized) {
        Logger.log(
          "debug",
          "Database connected. Here you can setup and run any other framework."
        );
        resolve();
      } else {
        reject("Database initialize failure");
      }
    });
  });
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

async function OnCommand(cmd: CommandType, ...argv: string[]) {
  const options = argv[2];

  Logger.log("debug", `command:${cmd},argvs[${argv}]`);
  switch (cmd) {
    case CommandType.k:
      if (argv.length < 1) {
        Logger.log("error", "bad command", argv);
        break;
      }
      return mk_kttdir_daily(argv[0]);
    case CommandType.p:
      if (argv.length < 2) {
        //use the default path to operate
        mk_kttdir_daily(cmd).then(async () => {
          return await paidan();
        });
        break;
      }
      return await paidan(
        path.resolve(__dirname, argv[0]),
        path.resolve(__dirname, argv[1]),
        options === "DB"
      );
    case CommandType.h:
      if (argv.length < 2) {
        //use the default path to operate
        mk_kttdir_daily(cmd).then(async () => {
          return await filterBills();
        });
        break;
      }
      return await filterBills(
        path.resolve(__dirname, argv[0]),
        path.resolve(__dirname, argv[1]),
        false
      );
    case CommandType.c:
      if (argv.length < 2) {
        Logger.log("error", "bad command", argv);
        break;
      }
      return await client(
        path.resolve(__dirname, argv[0]),
        path.resolve(__dirname, argv[1])
      );
    case CommandType.f:
      if (argv.length < 2) {
        Logger.log("error", "bad command", argv);
        break;
      }
      return await filterBills(
        path.resolve(__dirname, argv[0]),
        path.resolve(__dirname, argv[1]),
        true,
        options
      );
    case CommandType.t:
      dotest();
      break;
    case CommandType.l:
      if (argv.length < 1) {
        Logger.log("error", "bad command", argv);
        break;
      }
      loop(Number(argv[0]));
      break;
    default:
      Logger.log("error", `unsupport command:${cmd}`);
      break;
  }
}

// 定义一个消息队列，用于存储消息
interface cmdMsg extends IMemoryMessage {
  cmd: string;
  opt: string[];
}
class Msg implements cmdMsg {
  id: number;
  from: object;
  to: object;
  cmd: string;
  opt: string[];
}
interface MsgOptions {
  msgType: string;
  metadata?: any[];
  opt: string[];
}
const messageQueue = new MessageQueue<Msg>(50);
let msgID = 0;
// 向消息队列添加消息
async function postMessage(postMsg: MsgOptions) {
  const msg = [
    {
      id: msgID++,
      from: this,
      to: this,
      cmd: postMsg.msgType,
      opt: postMsg.opt,
      metadata: postMsg.metadata,
    },
    //{ id: msgID++, cmd: postMsg.msgType, opt: postMsg.opt },
  ];
  const ret = await messageQueue.sendMsg(msg);
  Logger.log("debug", "Send message", msg);
  return ret;
}

async function run() {
  // 启动消息处理循环
  for (;;) {
    const recvMsg: Msg[] = new Array<Msg>(5);
    // 启动等待信号的异步操作
    const v = await messageQueue.recvMsg(recvMsg, 3600000);
    //Logger.log("debug", "recv %d msg", v);

    for (let i = 0; i < v; i++) {
      const message = recvMsg[i]; // 获取队列中的第一个消息
      Logger.log("debug", "Processing message", message);
      OnCommand(message.cmd as CommandType, ...message.opt);
    }

    //console.log("runing ...");
  }
}
const sem = new Semaphore(0);
async function loop(counter: number) {
  while (counter > 0) {
    sem.release();
    counter--;
  }
}
async function dotest() {
  // mutex test
  // 创建互斥锁

  async function criticalSection(num: number) {
    //Logger.log("info", "----------------criticalSection is called %d", num);
    await sem
      .acquire(10000)
      .then(async () => {
        // 临界区代码
        Logger.log("info", "Entering critical section %d", num);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 模拟耗时操作
        Logger.log("info", "Exiting critical section %d", num);
      })
      .catch((reason) => {
        console.log(reason);
      });

    //Logger.log("info", "=================criticalSection end %d", num);
  }

  // 测试互斥锁
  //let profiler = Logger().startTimer();
  //sem.release();
  criticalSection(1);
  //sem.release();
  //Logger.log("info", "sem release");
  criticalSection(2);
  criticalSection(3);

  //dll loader test
  // 定义共享库的路径和函数签名
  const fileName = path.resolve(__dirname, "../lib/libmylib.so");
  console.log(`starting to load : ${fileName}`);
  try {
    const conn = ffi.DynamicLibrary(fileName, ffi.DynamicLibrary.FLAGS.RTLD_LAZY);
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

}
export { initialize, run, postMessage };
