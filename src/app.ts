import { Bill } from "./billing";
import * as path from "path";
import * as fs from "fs";
import * as BillFs from "./billfs";

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
const dailybill_back = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "dailybill_back.json"), "utf-8")
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
async function load_allbills(srcDir: string) {
  try {
    const bill = new Bill(billconfig);
    //bill.SetHeaderList(billconfig.headers)
    const files = fs.readdirSync(srcDir);
    let totalrows = 0;
    for (const file of files) {
      if (file.match(/\S*.xlsx|\S*.csv\b/)) {
        console.log(`start to load ${file}`);
        await bill
          .LoadFromFile(path.resolve(srcDir, file), billconfig.input.sheetid)
          .then((num) => {
            totalrows += num;
            console.log(`${num} rows are loaded`);
          });
      }
    }
    console.log(`total ${totalrows} rows are loaded`);
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
  load_allbills(srcDir).then((bill) => {
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
  console.log(`executing huidan ${srcDir}...${dstDir}`);
  filterBills(srcDir, dstDir, "回单|");
}

function client(srcDir: string, dstDir: string) {
  load_allbills(srcDir).then((bill) => {
    bill.SortData("phone");
    const clientlist = bill.BuildPrimaryKV("phone");

    const clientbill = new Bill(client_json);
    clientlist.forEach((v: number[]) => {
      clientbill.LoadClientFromBill(billconfig.name, v);
    });
    clientbill.SortData(client_json.primarykey);
    const filename = `${client_json.name}.xlsx`;
    clientbill.SaveToFile(path.resolve(dstDir, filename));
  });
}

function filterBills(srcDir: string, dstDir: string, filterName?: string) {
  const files: string[] = [];
  BillFs.fileSearch(srcDir, files, filterName).then(async () => {
    console.log(files);
    try {
      const bill = new Bill(dailybill_back);
      //bill.SetHeaderList(billconfig.headers)
      let totalrows = 0;
      for (const file of files) {
        for (let i = 0; i < 3; i++) {
          const num = await bill.LoadFromFile(file, i + 1);
          if (num === 0) continue;
          totalrows += num;
          break;
        }
      }
      console.log(`total ${totalrows} rows are loaded`);
      bill.SortData("product");
      //bill.ShowDataList()
      //const date = new Date();
      let filename = `${filterName}-${format_date()}-(${bill.Sum("num")}).xlsx`;
      //filename = filename.replace(/\*|\\|\/|\||\>|\<|\:|\?/gi,'');
      filename = filename.replace(/\*|\\|\/|\||\?/gi, "");
      filename = path.resolve(dstDir, filename);
      //console.log(`${filename}`)
      bill.SaveToFile(filename);
      console.log(`${filename} is generated`);
    } catch (error) {
      console.error("Error occurred while reading the directory!", error);
    }
  });
}

export { paidan, huidan, client, filterBills };
