import * as path from "path";
import { Command } from "commander";
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
  //console.log(packageInfo.version);
  const program = new Command();
  program
    .version(packageInfo.version)
    .description(packageInfo.description)
    .option("paidan  [sourceDir,destDir]", "generate the daily bill")
    .option("huidan [sourceDir,destDir]", "merge the courier bill")
    .option("filter [filter,sourceDir,destDir]", "merge the filtered bill")
    .option("client [sourceDir,destDir]", "collect the client info from bill")
    .parse(process.argv);
  //console.info(process.argv.slice(2).length);
  if (process.argv.slice(2).length === 1) {
    program.outputHelp();
  } else if (process.argv.slice(2).length >= 3) {
    const sourceDir = path.resolve(__dirname, process.argv[3]);
    const destDir = path.resolve(__dirname, process.argv[4]);
    const options = process.argv[5];
    const cmd = process.argv[2].toLowerCase();
    APP.postMessage({ msgType: cmd, opt: [sourceDir, destDir, options] }).then(
      //APP.OnCommand(cmd as APP.CommandType, sourceDir, destDir, options).then(
      () => {
        GetLogger("app").log(
          "info",
          "%s done and the program will exit in 5sec",
          cmd
        );
        setTimeout(() => {
          process.exit(0);
        }, 5000);
        //
      }
    );
  }

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
          "Available commands: help,prebill,paidan,huidan,test, loop N,send ,exit"
        );
        break;
      case "exit":
        rl.close();
        break;
      case "":
        break;
      case "send":
        comm_clnt_command(cmds);
        break;
      case "prebill":
      case "huidan":
      case "paidan":
      case "test":
      case "loop":
        APP.postMessage({ msgType: cmds.shift(), opt: cmds });
        break;
      default:
        console.log(`Unknown command: ${command}`);
        console.log(
          "Available commands: help,prebill,paidan,huidan,test, loop N,send ,exit"
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
