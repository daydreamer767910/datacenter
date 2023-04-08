import * as path from "path";
import { Command } from "commander";
import { Bill } from "./billing";

const program = new Command();
program
  .version("1.0.0")
  .description("An example CLI for ktt managing")
  .option("-p, --paidan  [sourceDir,destDir]", "generate the daily bill")
  .option("-h, --huidan [sourceDir,destDir]", "merge the courier bill")
  .parse(process.argv);
console.info(process.argv.length);
if (!process.argv.slice(2).length) {
  program.outputHelp();
} else {
  console.log(process.argv);
  const filePath = path.resolve(__dirname, process.argv[2]);
  const bill = new Bill("test");
  bill.InitHeaderList("billconfig.json");
  bill.ShowHeadList();
  bill.LoadFromFile(filePath).then(() => {
    console.log("---------------------------------------------------------");
    bill.ShowDataList();
    bill.SortData("联系电话");
    //bill.DeleteData(0,1)
    bill.ShowDataList();
  });
}
