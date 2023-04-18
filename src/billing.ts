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

class Bill extends DbCore {
  private static m_List: Map<string, Bill> = new Map();
  public static GetBill(name: string) {
    return Bill.m_List.get(name);
  }
  constructor(name: string) {
    super(name);
    Bill.m_List.set(name, this);
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

      workbook.xlsx.writeFile(filename);
    } catch (e) {
      console.error(e);
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

      return { dataidx, todo };
    });
    return datas;
  }
  public async LoadFromBill(billname: string, rowidxs?: number[]) {
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
          let value = datasrc.todo ? datasrc.todo(values) : values;
          if (!value || value === null || value === undefined) {
            //just in case the content in the accordingly cell is wrong
            //console.log((value==null)  +':' + (value===undefined))
            value = this.m_Config.content[j].default;
          }
          return Bill.DataTransform(this.m_Config.headers[j].datatype, value);
        });
        // let data: RowData = {Fields: fields}
        if (this.InsertData({ Fields: fields }) <= 0) {
          console.log("insert row[" + i + "]" + fields.toString() + " failed");
        }
      });
      return this.m_RowDataList.length - ret;
    } catch (e) {
      console.error("Error occurred while reading the directory!", e);
      return 0;
    }
  }
  public async LoadFromFile(filename: string, sheetid: number | string) {
    const workbook = new Excel.Workbook();
    try {
      if (filename.match(/\S*.csv\b/)) {
        const ret = workbook.csv.readFile(filename).then((ws) => {
          return this.LoadFromWS(ws);
        });
        return ret;
      } else {
        const ret = workbook.xlsx.readFile(filename).then((wk) => {
          return this.LoadFromWS(wk.getWorksheet(sheetid));
        });
        return ret;
      }
    } catch (e) {
      console.error(e);
      return 0;
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
        const fields = datasrc.map((datasrc, j: number) => {
          const values = datasrc.dataidx.map((v: number) => {
            //just in case the header defined int the JSON config is missed in the original excel file
            return v >= 0 ? row.getCell(v + 1).value?.valueOf() : undefined; //this.m_Config.content[j].default
          });
          let value = datasrc.todo ? datasrc.todo(values) : values;
          //console.log(`${value}---------------------------------`)
          if (!value || value === null || value === undefined) {
            //just in case the content in the accordingly cell is wrong
            //console.log(`${value}===${this.m_Config.content[j].default}`)
            value = this.m_Config.content[j].default;
            //console.log(datas[j].datasrc+'default:'+value)
          }
          return Bill.DataTransform(this.m_Config.headers[j].datatype, value);
        });
        //console.log("datasize is:"+data.Fields.length)
        if (this.InsertData({ Fields: fields }) <= 0) {
          console.log("insert row[" + i + "]" + fields.toString() + " failed");
        }
      }
      return this.m_RowDataList.length - ret;
    } catch (e) {
      console.error(e);
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
            ret = a.Fields.at(idx) < b.Fields.at(idx) ? -1 : 1;
            break;
          case "number":
            ret = a.Fields.at(idx) - b.Fields.at(idx);
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
