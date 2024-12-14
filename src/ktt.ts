#!/usr/bin/env node
import dotenv from "dotenv";
import * as path from "path";
import * as APP from "./app";
import { Register,GetLogger } from "./logger";
import { Commsrv } from "./commsrv";
import { Websrv } from "./websrv";

const envPath = path.resolve(__dirname, "../.env");
const result = dotenv.config({ path: envPath });
if (result.parsed) {
  const LogServices = ["app", "comm", "sys", "db"];
  Register(LogServices);
  Commsrv.initialize(Number(process.env.COMM_PORT));
  Websrv.initialize(Number(process.env.WEB_PORT));
  APP.initialize()
    .then(() => {
      APP.run();
    })
    .catch((error) => GetLogger("sys").log("error", error));
} else {
  console.log(`config env ${envPath} failed: ${result.error}`);
}

