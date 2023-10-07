import * as path from "path";
import * as APP from "./app";
import { GetLogger } from "./logger";
import * as Readline from "readline";
import { comm_clnt_command } from "./commclnt";
//import * as packageInfo from "../package.json";
import * as fs from "fs";

APP.initialize()
  .then(() => {
    APP.run();
    cli_startup();
  })
  .catch((error) => GetLogger("sys").log("error", error));

function cli_startup() {
  const packageInfo = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8")
  );
  //cli for dev and test
  const rl = Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "bill> ", // 设置提示符
  });

  rl.prompt();

  rl.on("line", (command) => {
    // 在这里处理命令
    const cmds = command.trim().split(" ");
    switch (cmds[0]) {
      case "help":
        console.log(
          "Available commands: help,paidan,huidan,test, loop N,send ,exit"
        );
        break;
      case "exit":
        rl.close();
        break;
      case "":
        break;
      case "version":
        console.log(packageInfo.version);
        console.log(packageInfo.description);
        break;
      case "send":
        comm_clnt_command(cmds);
        break;
      case "huidan":
      case "paidan":
      case "test":
      case "loop":
        APP.postMessage({ msgType: cmds.shift(), opt: cmds });
        break;
      default:
        console.log(`Unknown command: ${command}`);
        console.log(
          "Available commands: help,paidan,huidan,test, loop N,send ,exit"
        );
        break;
    }
    rl.prompt();
  }).on("close", () => {
    console.log("Exiting CLI.");
    process.exit(0);
  });
  //setTimeout(() => process.exit(0), 5000);
}
