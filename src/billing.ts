/**
 *   vdb billing
 *
 *   @copyright 2023 Bill.Liu .
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */
import { DbCore } from "./dbcore";
import Excel from "exceljs";
import { GetLogger } from "./logger";
import { Billing } from "./entity/KttBilling";
import { AppDataSource } from "./data-source";

class Bill extends DbCore {
  private static m_List: Map<string, Bill> = new Map();
  public static GetBill(name: string) {
    return Bill.m_List.get(name);
  }
  constructor(config: any) {
    super(config);
    Bill.m_List.set(config.name, this);
  }

  public async SaveToDB() {
    const billing = new Billing();
    billing.initialize();
    const dbkeys = Object.keys(billing);
    //console.log(dbkeys);
    //const exlkeys = this.GetHeaderKeys();
    //const headkeys = dbkeys.filter((item) => exlkeys.includes(item));
    const ret = { sucess: 0, failure: 0 };
    for (let row = 0; row < this.m_RowDataList.length; row++) {
      this.GetDataFieldsByKeys(row, dbkeys).forEach((field, i) => {
        Object.defineProperty(billing, dbkeys[i], {
          value: field,
          writable: true,
        });
      });
      billing.pk = undefined;
      try {
        await AppDataSource.manager.save(billing);
        ret.sucess++;
      } catch (error) {
        GetLogger("db").log("error", error);
        ret.failure++;
      }
    }
    return ret;
  }
  /**
   * SaveToFile()
   */
  public async SaveToFile(filename: string) {
    const workbook = new Excel.Workbook();
    workbook.creator = this.m_Config.author;
    try {
      const worksheet = workbook.addWorksheet(this.m_Config.sheetid);

      worksheet.columns = this.m_Config.headers;
      //console.log(worksheet.columns)
      let i = 2;
      for (; i < this.m_RowDataList.length + 2; i++) {
        worksheet.getRow(i).values = this.m_RowDataList[i - 2].Fields;
      }
      //add sum
      if (this.m_Config.sum) {
        for (const sum of this.m_Config.sum) {
          const cell = worksheet
            .getRow(i)
            .getCell(this.GetHeaderIndex(sum) + 1);
          cell.value = this.Sum(sum);
        }
      }

      return await workbook.xlsx.writeFile(filename);
    } catch (e) {
      GetLogger("sys").error(e);
      return Promise.reject(e);
    }
  }
  protected ParseContent(
    content: { datasrc: string[]; todo: string }[],
    srcheader: string[]
  ) {
    const datas = content.map((item: { datasrc: string[]; todo: string }) => {
      const dataidx: number[] = Array.from({ length: item.datasrc.length });
      dataidx.fill(-1);
      item.datasrc.forEach((d, j) => {
        srcheader.forEach((h, i) => {
          if (d === h) {
            dataidx[j] = i;
          }
        });
      });
      const todo = eval(item.todo);
      //console.log(todo)
      return { dataidx, todo };
    });
    return datas;
  }
  private calculate(todo: any, params: any[], def?: any) {
    //console.log(typeof params + params.length)
    let value = todo ? todo(params) : params;
    if (!value || value === null || value === undefined) {
      value = def ? def : value;
    }
    return value;
  }
  public LoadClientFromBill(billname: string, rowidxs: number[]) {
    const bill = Bill.GetBill(billname);
    if (!bill) return -1;
    try {
      const ret = this.m_RowDataList.length;
      const datasrc = this.ParseContent(
        this.m_Config.content,
        bill.GetHeaderNames()
      );
      //for(let i=0;i<bill.GetDataSize();i++) {
      let total_fields: any[] = [];
      rowidxs.forEach((i) => {
        const fields = datasrc.map((datasrc, j: number) => {
          const values = bill.GetDataFieldsByIndexs(i, datasrc.dataidx);
          const value = this.calculate(
            datasrc.todo,
            values,
            this.m_Config.content[j].default
          );
          /* let value = datasrc.todo ? datasrc.todo(values) : values.join();
          if (!value || value === null || value === undefined) {
            //just in case the content in the accordingly cell is wrong
            //console.log((value==null)  +':' + (value===undefined))
            value = this.m_Config.content[j].default?this.m_Config.content[j].default:value;
          }*/
          return Bill.DataTransform(this.m_Config.headers[j].datatype, value);
        });
        if (total_fields.length == 0) {
          total_fields = fields;
        } else {
          total_fields.forEach((v, i) => {
            if (typeof v === "number") {
              total_fields[i] += fields[i];
            } else if (typeof v === "string" && v != fields[i]) {
              const s1 = v.toString();
              const s2 = fields[i].toString();
              if (s1.length < s2.length && s2.includes(s1)) {
                total_fields[i] = fields[i];
              }
            }
          });
        }
      });
      // let data: RowData = {Fields: fields}
      if (this.InsertData({ Fields: total_fields }) <= 0) {
        GetLogger("app").log(
          "info",
          "insert row[" + ret + "]" + total_fields.toString() + " failed"
        );
      }
      return this.m_RowDataList.length - ret;
    } catch (e) {
      console.error("Error occurred while reading the directory!", e);
      return 0;
    }
  }
  public LoadFromBill(billname: string, rowidxs?: number[]) {
    const bill = Bill.GetBill(billname);
    if (!bill) return -1;
    try {
      const ret = this.m_RowDataList.length;
      const datasrc = this.ParseContent(
        this.m_Config.content,
        bill.GetHeaderNames()
      );
      const rowlist: number[] = new Array<number>(
        rowidxs ? rowidxs.length : bill.GetDataSize()
      );
      if (rowidxs) {
        for (let i = 0; i < rowidxs.length; i++) {
          if (rowidxs[i] >= 0 && rowidxs[i] < bill.GetDataSize())
            rowlist[i] = rowidxs[i];
          else rowlist[i] = -1;
        }
      } else {
        for (let i = 0; i < bill.GetDataSize(); i++) rowlist[i] = i;
      }
      //for(let i=0;i<bill.GetDataSize();i++) {
      rowlist.forEach((i) => {
        const fields = datasrc.map((datasrc, j: number) => {
          const values = bill.GetDataFieldsByIndexs(i, datasrc.dataidx);

          const value = this.calculate(
            datasrc.todo,
            values,
            this.m_Config.content[j].default
          );
          return Bill.DataTransform(this.m_Config.headers[j].datatype, value);
        });
        // let data: RowData = {Fields: fields}
        if (this.InsertData({ Fields: fields }) <= 0) {
          console.log("insert row[" + i + "]" + fields.toString() + " failed");
        }
      });
      return this.m_RowDataList.length - ret;
    } catch (e) {
      GetLogger("sys").error("Error occurred while reading the directory!", e);
      return 0;
    }
  }
  public async LoadFromFile(filename: string, sheetid: number | string) {
    const workbook = new Excel.Workbook();
    try {
      let ret = 0;
      if (filename.match(/\S*.csv$/)) {
        await workbook.csv.readFile(filename).then((ws) => {
          //console.log("++++++++++++++++++++++++");
          ret = this.LoadFromWS(ws);
        });
        GetLogger("app").log("info", `${ret} rows in ${filename}`);
      } else if (filename.match(/\S*.xlsx$/)) {
        await workbook.xlsx.readFile(filename).then((wk) => {
          //console.log("--------------------------");
          const ws = wk.getWorksheet(sheetid);
          if (ws === undefined) {
            GetLogger("app").log(
              "info",
              `can not find sheet[${sheetid}] in ${filename}`
            );
          } else {
            ret = this.LoadFromWS(ws);
            //console.log(`${ret} rows in ${filename}`);
          }
        });
      } else {
        GetLogger("app").error(`unsurpport type of file[${filename}]`);
      }
      return Promise.resolve(ret);
    } catch (e) {
      GetLogger("sys").error(e);
      return Promise.reject(e);
    }
  }
  /**
   * LoadFromFile
   */
  private LoadFromWS(worksheet: Excel.Worksheet) {
    try {
      const ret = this.m_RowDataList.length;

      const row = worksheet.getRow(1); // header
      const headers: string[] = Array.from({ length: row.cellCount });
      row.eachCell((cell, i) => {
        headers[i - 1] = cell.toString();
      });
      const datasrc = this.ParseContent(this.m_Config.content, headers);
      //console.log(headers.flat())
      for (let i = 2; i < worksheet.rowCount + 1; i++) {
        const row = worksheet.getRow(i);
        const fields = datasrc.map((srcitem, j: number) => {
          const values = srcitem.dataidx.map((jj: number) => {
            //just in case the header defined int the JSON config is missed in the original excel file
            if (jj >= 0) {
              const cell = row.getCell(jj + 1);
              switch (cell.type) {
                case Excel.ValueType.RichText:
                  return cell.text;
                case Excel.ValueType.Formula:
                  return cell.result;
                case Excel.ValueType.Date:
                  return cell.toString();
                default:
                  return cell.value;
              }
            }
            return undefined;
            //return jj >= 0 ? row.getCell(jj + 1).value?.valueOf() : undefined;
          });

          const value = this.calculate(
            srcitem.todo,
            values,
            this.m_Config.content[j].default
          );
          //console.log(`--------------------${value}[${typeof value}]---------------------------`)
          return Bill.DataTransform(this.m_Config.headers[j].datatype, value);
        });
        //console.log("datasize is:"+data.Fields.length)
        if (this.InsertData({ Fields: fields }) <= 0) {
          GetLogger("app").log(
            "info",
            "insert row[" + i + "]" + fields.toString() + " failed"
          );
        }
      }
      return this.m_RowDataList.length - ret;
    } catch (e) {
      GetLogger("sys").error(e);
      return 0;
    }
  }

  public SortData(x: number | string) {
    let idx = -1;
    if (typeof x === "string") {
      idx = this.m_Config.headers.findIndex(
        (h: { header: string; key: string }) => {
          return h.header === x || h.key === x;
        }
      );
      //console.log("--------------"+ x + "idx:" + idx)
    } else if (typeof x === "number") {
      idx = x;
    }
    if (idx >= 0 && this.m_RowDataList.length > 1) {
      this.m_RowDataList.sort((a, b) => {
        let ret = 0;
        switch (this.m_Config.headers[idx].datatype.toLowerCase()) {
          case "string":
            ret = b.Fields.at(idx) < a.Fields.at(idx) ? -1 : 1;
            break;
          case "number":
            ret = b.Fields.at(idx) - a.Fields.at(idx);
            break;
          case "object":
          case "any":
          default:
            break;
        }
        //console.log("--------------field["+ idx + "] :" + a.Fields.at(idx))
        return ret;
      });
      //this.BuildPrimaryKV(idx)
    }
    //throw new Error(`wrong key|name|index[${x}]`)
  }
}
export { Bill };
