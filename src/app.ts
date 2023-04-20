import { Bill } from "./billing";
import * as path from "path";
import * as fs from "fs";

const billconfig = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "billconfig.json"), "utf-8")
);
const dailybill = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "dailybill.json"), "utf-8")
);
const dailybill_A = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "dailybill_A.json"), "utf-8")
);
const dailybill_F = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "dailybill_F.json"), "utf-8")
);
const dailybill_H = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "dailybill_H.json"), "utf-8")
);
const client_json = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "client.json"), "utf-8")
);

const format_date = () => {
  const date = new Date();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  let fm: string = m < 10 ? "0" + m.toString() : m.toString();
  fm += d < 10 ? "0" + d : d;
  return fm;
};
async function load_allbills(srcDir: string, dstDir: string) {
  try {
    const bill = new Bill(billconfig);
    //bill.SetHeaderList(billconfig.headers)
    const files = fs.readdirSync(srcDir);
    for (const file of files) {
      if (file.match(/\S*.xlsx|\S*.csv\b/)) {
        console.log(`start to load ${file}`);
        await bill
          .LoadFromFile(path.resolve(srcDir, file), billconfig.input.sheetid)
          .then((num) => console.log(`${num ? num : 0} rows are loaded`));
      }
    }
    return bill;
  } catch (error) {
    console.error("Error occurred while reading the directory!", error);
    return Promise.reject(error);
  }
}
async function dispatch_bills(
  dstDir: string,
  billname: string,
  dataidx: number[]
) {
  //console.log(`start to generate bill[${billname}].....`)
  let bill: Bill;
  switch (billname.at(0)) {
    case "A": //for 1688
      bill = new Bill(dailybill_A);
      break;
    case "F": //for flower city
      bill = new Bill(dailybill_F);
      break;
    case "H": //for huinong
      bill = new Bill(dailybill_H);
      break;
    case "C": //for caigou
    default: //all the wechat providers
      bill = new Bill(dailybill);
      break;
  }

  bill.LoadFromBill(billconfig.name, dataidx).then((n) => {
    console.log(`[${billname}] ${n} rows dispatched`);
    //const date = new Date();
    const filename = `${billname}-${format_date()}-(${bill.Sum(
      "num"
    )})露露甄选(18665316526).xlsx`;
    bill.SaveToFile(path.resolve(dstDir, filename));
  });
}
function paidan(srcDir: string, dstDir: string) {
  load_allbills(srcDir, dstDir).then((bill) => {
    bill.SortData(billconfig.primarykey);
    //bill.ShowDataList()
    //const date = new Date();
    const filename = `${billconfig.name}-${format_date()}-(${bill.Sum(
      "num"
    )}).xlsx`;
    bill.SaveToFile(path.resolve(dstDir, filename));
    const billlist = bill.BuildPrimaryKV(billconfig.primarykey);
    billlist.forEach((v: number[], k) => {
      dispatch_bills(dstDir, k.toString(), v);
    });
  });
}

function huidan(srcDir: string, dstDir: string) {
  console.log(`to be done for huidan ${srcDir}...${dstDir}`);
}

function client(srcDir: string, dstDir: string) {
  load_allbills(srcDir, dstDir).then((bill) => {
    bill.SortData("phone");
    const clientlist = bill.BuildPrimaryKV("phone");

    const clientbill = new Bill(client_json);
    clientlist.forEach((v: number[], k) => {
      clientbill.LoadClientFromBill(billconfig.name, v);
    });
    clientbill.SortData(client_json.primarykey);
    const filename = `${client_json.name}.xlsx`;
    clientbill.SaveToFile(path.resolve(dstDir, filename));
  });
}

export { paidan, huidan, client };
