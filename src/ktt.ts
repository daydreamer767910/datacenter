#!/usr/bin/env node
import dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { App } from "./app";
import { Register, GetLogger } from "./logger";
import { AppDataSource } from "./data-source";
import { Commsrv } from "./commsrv";
import { Websrv } from "./websrv";

const envPath = path.resolve(__dirname, "../.env");
const result = dotenv.config({ path: envPath });
if (result.parsed) {
  const LogServices = ["app", "comm", "web", "sys", "db"];
  Register(LogServices);
  AppDataSource.initialize().then((datasource) => {
    if (datasource.isInitialized) {
      GetLogger("db").log(
        "debug",
        "Database connected. Here you can setup and run any other framework."
      );
      Commsrv.initialize(Number(process.env.COMM_PORT));
      Websrv.initialize(Number(process.env.WEB_PORT));
      App.initialize();
      const packageInfo = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8")
      );
      GetLogger("app").log(
        "info",
        `KTT app V${packageInfo.version}:${packageInfo.description} is running`
      );
    } else {
      GetLogger("db").log("error", "Database initialize failure");
    }
  });
} else {
  console.log(`config env ${envPath} failed: ${result.error}`);
}
