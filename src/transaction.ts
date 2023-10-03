import { Bill } from "./billing";
import * as path from "path";
import * as BillFs from "./billfs";
import * as LOG from "./logger";
import child_process from "child_process";

const Logger = {
  log: (level: string, message: string, ...meta: any[]) =>
    LOG.GetLogger("app")?.log(level, message, ...meta),
};

const format_date = () => {
  const date = new Date();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  let fm: string = m < 10 ? "0" + m.toString() : m.toString();
  fm += d < 10 ? "0" + d : d;
  return fm;
};

function mk_kttdir_daily(type: string) {
  return new Promise<void>((resolve) => {
    const action =
      type === "paidan"
        ? process.env.KTT_PRE_PAIDAN
        : process.env.KTT_PRE_HUIDAN;
    //const today = format_date();
    const bashrun = child_process.spawn(action);
    bashrun.stdout.setEncoding("utf-8");
    bashrun.stdout.on("data", (data) => {
      Logger.log("debug", data);
    });
    bashrun.stderr.setEncoding("utf-8");
    bashrun.stderr.on("data", (data) => {
      Logger.log("error", data);
    });
    bashrun.on("close", (b) => {
      Logger.log("debug", `${action} is done ${b}`);
      resolve();
    });
    setTimeout(() => {
      resolve();
    }, 3000);
  });
}

async function load_allbills(
  srcDir: string,
  searchSubDir = true,
  filterName?: string
) {
  try {
    const bill = new Bill(BillFs.billconfig);
    //bill.SetHeaderList(billconfig.headers)
    const fileinfos = await BillFs.fileSearch(srcDir, searchSubDir, filterName);
    //const files = fs.readdirSync(srcDir);
    let totalrows = 0;
    for (const fileinfo of fileinfos) {
      //if (file.match(/\S*.xlsx|\S*.csv\b/)) {
      Logger.log("debug", `start to load ${fileinfo.path}`);
      //console.log(`start to load ${file}`);
      await bill
        .LoadFromFile(
          path.resolve(srcDir, fileinfo.path),
          BillFs.billconfig.input.sheetid
        )
        .then((num) => {
          totalrows += num;
          Logger.log("debug", `${num} rows are loaded`);
          //console.log(`${num} rows are loaded`);
        });
      //}
    }
    Logger.log("debug", `total ${totalrows} rows are loaded`);
    //console.log(`total ${totalrows} rows are loaded`);
    return bill;
  } catch (error) {
    Logger.log("error", "Error occurred while reading the directory!");
    //console.error("Error occurred while reading the directory!", error);
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
      bill = new Bill(BillFs.dailybill_A);
      break;
    case "F": //for flower city
      bill = new Bill(BillFs.dailybill_F);
      break;
    case "H": //for huinong
      bill = new Bill(BillFs.dailybill_H);
      break;
    case "C": //for caigou
    default: //all the wechat providers
      bill = new Bill(BillFs.dailybill);
      break;
  }

  const n = bill.LoadFromBill(BillFs.billconfig.name, dataidx);
  //console.log(`[${billname}] ${n} rows dispatched`);
  //const date = new Date();
  const filename = `${billname}-${format_date()}-(${bill.Sum(
    "num"
  )})露露甄选(18665316526).xlsx`;
  await bill.SaveToFile(path.resolve(dstDir, filename));
  Logger.log("debug", `[${billname}] ${n} rows dispatched to [${filename}]`);
  return n;
}
async function paidan(srcDir?: string, dstDir?: string, toDB = true) {
  dstDir = dstDir
    ? dstDir
    : process.env.KTT_PATH + "\\dailybill\\" + format_date();
  srcDir = srcDir ? srcDir : dstDir + "\\bak";

  const bill = await load_allbills(srcDir, false);
  bill.SortData(BillFs.billconfig.primarykey);
  //bill.ShowDataList()
  //const date = new Date();
  const filename = `${BillFs.billconfig.name}-${format_date()}-(${bill.Sum(
    "num"
  )}).xlsx`;
  await bill.SaveToFile(path.resolve(dstDir, filename));
  if (toDB) {
    await bill.SaveToDB().then((v) => {
      Logger.log(
        "info",
        "save to database: %d success , %d failed",
        v.sucess,
        v.failure
      );
    });
  }
  const billlist = bill.BuildPrimaryKV(BillFs.billconfig.primarykey);
  const promises: Promise<number>[] = [];
  billlist.forEach((v: number[], k) => {
    promises.push(dispatch_bills(dstDir, k.toString(), v));
    //console.log(`k[${k.toString()}]v[${v}]`);
  });
  await Promise.all(promises).then((v) => {
    Logger.log(
      "info",
      "%d rows are dispatched",
      v.reduce((a, c) => {
        return a + c;
      }, 0)
    );
  });
  return bill;
}

async function client(srcDir: string, dstDir: string) {
  const bill = await load_allbills(srcDir);
  bill.SortData("phone");
  const clientlist = bill.BuildPrimaryKV("phone");

  const clientbill = new Bill(BillFs.client_json);
  clientlist.forEach((v: number[]) => {
    clientbill.LoadClientFromBill(BillFs.billconfig.name, v);
  });
  clientbill.SortData(BillFs.client_json.primarykey);
  const filename = `${BillFs.client_json.name}.xlsx`;
  await clientbill.SaveToFile(path.resolve(dstDir, filename));
  Logger.log("info", `${filename} is generated`);
  return clientbill;
}

async function filterBills(
  srcDir?: string,
  dstDir?: string,
  searchSubDir = true,
  filterName?: string
) {
  dstDir = dstDir
    ? dstDir
    : process.env.KTT_PATH + "\\dailybill\\" + format_date() + "\\bak";
  srcDir = srcDir
    ? srcDir
    : process.env.KTT_PATH + "\\express\\" + format_date();
  const fileinfos = await BillFs.fileSearch(srcDir, searchSubDir, filterName);
  //console.log(fileinfos);
  const bill = new Bill(BillFs.dailybill_back);
  try {
    //bill.SetHeaderList(billconfig.headers)
    let totalrows = 0;
    for (const fileinfo of fileinfos) {
      for (let i = 0; i < 3; i++) {
        const num = await bill.LoadFromFile(
          path.resolve(srcDir, fileinfo.path),
          i + 1
        );
        Logger.log("debug", "load %d rows from %s", num, fileinfo.path);
        if (num === 0) continue;
        totalrows += num;
        break;
      }
    }

    bill.SortData(BillFs.dailybill_back.primarykey);
    //bill.ShowDataList()
    //const date = new Date();
    let filename_1 = `${
      filterName ? filterName : bill.GetName()
    }-${format_date()}-(${bill.Sum("num")}).xlsx`;
    //filename = filename.replace(/\*|\\|\/|\||\>|\<|\:|\?/gi,'');
    filename_1 = filename_1.replace(/\*|\\|\/|\||\?/gi, "");
    filename_1 = path.resolve(dstDir, filename_1);
    //console.log(`${filename}`)
    await bill.SaveToFile(filename_1);
    Logger.log(
      "info",
      `${filename_1} is generated with total ${totalrows} rows`
    );
  } catch (error) {
    console.error("Error occurred while reading the directory!", error);
  }
  return bill;
}
export { paidan, filterBills, client, mk_kttdir_daily };
