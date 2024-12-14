#!/usr/bin/env node
import dotenv from "dotenv";
import * as path from "path";
import { App } from "./app";
import { Register } from "./logger";
import * as Readline from "readline";
import { comm_clnt_command } from "./commclnt";
//import * as packageInfo from "../package.json";
import * as fs from "fs";
import { AppDataSource } from "./data-source";
import { Commsrv } from "./commsrv";
import { Websrv } from "./websrv";

const envPath = path.resolve(__dirname, "../.env");
const result = dotenv.config({ path: envPath });
if (result.parsed) {
  const LogServices = ["app", "comm","web", "sys", "db"];
  Register(LogServices);
  AppDataSource.initialize().then((datasource) => {
      if (datasource.isInitialized) {
        console.log(
          "Database connected. Here you can setup and run any other framework."
        );
        App.initialize();
        cli_startup();
      } else {
        console.error("Database initialize failure");
      }
    });
} else {
  console.log(`config env ${envPath} failed: ${result.error}`);
}


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
          "Available commands: help,paidan,huidan,test, loop N,send ,commsrv 7899,websrv 8080,exit"
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
      case "commsrv":
        Commsrv.initialize(Number(cmds[1]||'7899'));
        break
      case "websrv":
        Websrv.initialize(Number(cmds[1]||'8080'));
        break
      case "send":
        comm_clnt_command(cmds);
        break;
      case "huidan":
      case "paidan":
      case "filter":
      case "client":
      case "test":
      case "loop":
        App.postMessage({ cmd: cmds.shift(), opt: cmds });
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
