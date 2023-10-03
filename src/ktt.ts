#!/usr/bin/env node
import { Table, RowData } from "./table";
import { DbCore } from "./dbcore";
import * as APP from "./app";
import { GetLogger } from "./logger";

APP.initialize()
  .then(() => {
    APP.run();
  })
  .catch((error) => GetLogger("sys").log("error", error));

export { Table, RowData, DbCore };
