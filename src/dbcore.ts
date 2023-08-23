/**
 *   vdb core
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
import { Table, RowData } from "./table";

class DbCore implements Table {
  protected m_Name = "";
  protected m_RowDataList: Array<RowData> = [];
  protected m_Config: any;
  protected constructor(config: any) {
    this.m_Config = config;
    this.m_Name = config.name;
    this.m_RowDataList = new Array(0);
  }

  public GetHeaderSize() {
    return this.m_Config.headers.length;
  }

  public GetDataSize() {
    return this.m_RowDataList.length;
  }

  public GetHeaderNames(): string[] {
    return this.m_Config.headers.map((h: { header: string }) => h.header);
  }

  public GetHeaderKeys(): string[] {
    return this.m_Config.headers.map((k: { key: string }) => k.key);
  }

  protected GetHeaderIndex(x: string) {
    return this.m_Config.headers.findIndex(
      (h: { header: string; key: string }) => {
        return h.header === x || h.key === x;
      }
    );
  }

  public Sum(x: string, rows: number[] = []) {
    let data = 0;
    const column = this.GetHeaderIndex(x);
    if (column >= 0) {
      if (rows.length == 0) {
        for (const i in this.m_RowDataList) {
          data += this.m_RowDataList[i].Fields.at(column);
        }
      } else {
        for (const i of rows) {
          data += this.m_RowDataList[i].Fields.at(column);
        }
      }
    }
    return data;
  }

  public BuildPrimaryKV(x: number | string) {
    let idx = -1;
    if (typeof x === "string") {
      idx = this.GetHeaderIndex(x);
      //console.log("--------------"+ x + "idx:" + idx)
    } else if (typeof x === "number") {
      idx = x;
    }
    const ret = new Map<any, number[]>();
    if (idx >= 0) {
      this.m_RowDataList.map((value, index) => {
        const k = value.Fields.at(idx);
        if (ret.has(k)) {
          const idxs = ret.get(k);
          idxs?.push(index);
          //ret.set(k,idxs)
        } else {
          const idxs: number[] = [index];
          ret.set(k, idxs);
        }
      });
    }
    return ret;
  }

  public GetDataFieldsByIndexs(RowId: number, fieldidxs: number[]) {
    const rowdata = this.GetData(RowId);
    const fieldids = Array.from({ length: fieldidxs.length });
    fieldids.fill(undefined);
    fieldidxs.forEach((v, i) => {
      if (rowdata && v >= 0 && v < rowdata.Fields.length)
        fieldids[i] = rowdata.Fields[v];
    });
    return fieldids;
  }
  public GetDataFieldsByNames(RowId: number, FieldNames: string[]) {
    const rowdata = this.GetData(RowId);
    const fieldids = Array.from({ length: FieldNames.length });

    FieldNames.forEach((v, i) => {
      this.m_Config.headers.forEach((h: { header: string }, j: number) => {
        if (v === h.header) {
          fieldids[i] = rowdata?.Fields[j];
          return;
        }
      });
    });
    return fieldids;
  }
  public GetData(idx: number) {
    if (idx > this.m_RowDataList.length || idx < 0) return null;
    return this.m_RowDataList[idx];
  }
  protected static DataTransform(datatype: string, value: any) {
    //const aaa = typeof value;
    if (typeof value !== datatype) {
      //console.log(`type unmatched and to be transfered![${datatype}] is expeted while [${typeof value}] is presented for[${value}]`);
      switch (datatype) {
        case "string":
          return value.toString();
        case "boolean":
          return Boolean(value);
        case "number":
          return Number(value);
        case "bigint":
          return BigInt(value);
        case "symbol":
          return Symbol(value);
        case "object":
        case "undefined":
        case "function":
        default:
          return value;
      }
    }
    return value;
  }
  private CheckRowData(data: RowData) {
    if (data.Fields.length != this.m_Config.headers.length) {
      console.log(
        `data structure wrong:expected[${this.m_Config.headers.length}]while[${data.Fields.length}]`
      );
      return false;
    }
    for (let i = 0; i < this.m_Config.headers.length; i++) {
      const datetype = this.m_Config.headers[i].datatype;
      if (datetype != typeof data.Fields.at(i)) {
        console.log(
          `field[${i}]name[${
            this.m_Config.headers[i].header
          }]error:required type:${datetype}-->while type:${typeof data.Fields.at(
            i
          )} :data[${data.Fields.at(i)}]`
        );
        return false;
      }
      /* check if madatory field is null*/
      const content = this.m_Config.headers[i].content;
      if (content === "madatory" && data.Fields.at(i).length === 0) {
        console.log(
          `field[${i}]name[${
            this.m_Config.headers[i].header
          }]error:required madatory-->while data[${data.Fields.at(i)}] is null`
        );
        return false;
      }
    }
    return true;
  }
  public InsertData(data: RowData) {
    if (!this.CheckRowData(data)) return 0;
    return this.m_RowDataList.push(data);
  }
  public DeleteData(idx: number, num = 1) {
    const d = this.m_RowDataList.slice(idx, idx + num);
    this.m_RowDataList.copyWithin(idx, idx + num);
    for (let i = 0; i < num; i++) this.m_RowDataList.pop();
    return d;
  }
  public ShowHeadList() {
    console.log(this.m_Config.headers);
  }
  public ShowDataList() {
    this.m_RowDataList.forEach((d, i) => {
      console.log(`row[${i}]:data:${d.Fields.toString()}`);
    });
  }
  /**
   * GetName
   */
  public GetName() {
    return this.m_Name;
  }
}

export { DbCore };
