import * as path from "path";
import { Command } from "commander";
import * as APP from "./app";

const program = new Command();
program
  .version("1.0.1")
  .description("An example CLI for ktt managing")
  .option("p, paidan  [sourceDir,destDir]", "generate the daily bill")
  .option("h, huidan [sourceDir,destDir]", "merge the courier bill")
  .parse(process.argv);
//console.info(process.argv.slice(2).length);
if (!process.argv.slice(2).length) {
  program.outputHelp();
} else if (process.argv.slice(2).length == 3) {
  const sourceDir = path.resolve(__dirname, process.argv[3]);
  const destDir = path.resolve(__dirname, process.argv[4]);
  //console.log("srcDir:" + sourceDir);
  //console.log("destDir:" + destDir);
  //console.log("---------------------------------------------------------"+ typeof new Date())
  if (
    process.argv[2].toLowerCase() === "p" ||
    process.argv[2].toLowerCase() === "paidan"
  ) {
    APP.paidan(sourceDir, destDir);
    console.log("the program will exit in 10 sec!");
    setTimeout(() => console.log("exit!"), 10000);
  } else if (
    process.argv[2].toLowerCase() === "h" ||
    process.argv[2].toLowerCase() === "huidan"
  ) {
    APP.huidan(sourceDir, destDir);
    console.log("the program will exit in 10 sec!");
    setTimeout(() => console.log("exit!"), 10000);
  } else if (
    process.argv[2].toLowerCase() === "c" ||
    process.argv[2].toLowerCase() === "client"
  ) {
    APP.client(sourceDir, destDir);
    //console.log("the program will exit in 10 sec!");
    //setTimeout(() => console.log("exit!"), 10000);
  }
}
