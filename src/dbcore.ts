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
import { Table, HeaderInfo, RowData } from "./table";

class DbCore implements Table {
  protected m_HeaderList: Array<HeaderInfo> = [];
  protected m_Name = "";
  protected m_RowDataList: Array<RowData> = [];
  protected constructor(name: string) {
    this.m_Name = name;
    this.m_HeaderList = new Array(0);
    this.m_RowDataList = new Array(0);
  }
  /**
     * SetHeaderList
    headers : HeaderInfo[]     */
  public SetHeaderList(headers: HeaderInfo[]) {
    headers.forEach((element) => {
      this.m_HeaderList.push(element);
    });
  }
  public GetHeaderSize() {
    return this.m_HeaderList.length;
  }
  /**
     * GetHeaderItem
     
     */
  public GetHeader(x: string | number) {
    if (typeof x === "number") {
      if (x < this.m_HeaderList.length) {
        return this.m_HeaderList.at(x);
      }
      return null;
    } else if (typeof x === "string") {
      this.m_HeaderList.forEach((value) => {
        if (value.name === x) return value;
      });
      return null;
    }
    return null;
  }
  public GetDataSize() {
    return this.m_RowDataList.length;
  }

  private CheckRowData(data: RowData) {
    if (data.Fields.length != this.m_HeaderList.length) {
      console.log("data structure wrong");
      return false;
    }

    this.m_HeaderList.forEach((header, index) => {
      if (header.datatype != typeof data.Fields.at(index)) {
        console.log(
          "field[" +
            index +
            "]error:" +
            "required data type: " +
            header.datatype +
            "--> while data type:" +
            typeof data.Fields.at(index)
        );
        return false;
      }
    });

    return true;
  }
  public InsertData(data: RowData) {
    if (!this.CheckRowData(data)) return -1;
    return this.m_RowDataList.push(data);
  }
  public DeleteData(idx: number, num = 1) {
    const d = this.m_RowDataList.slice(idx, idx + num);
    this.m_RowDataList.copyWithin(idx, idx + num);
    for (let i = 0; i < num; i++) this.m_RowDataList.pop();
    return d;
  }
  public ShowHeadList() {
    this.m_HeaderList.forEach((h, i) => {
      console.log(
        "head field[" +
          i +
          "] :" +
          "name:" +
          h.name +
          " type:" +
          h.datatype +
          " srcname:" +
          h.datasrc?.name +
          " srcfile:" +
          h.datasrc?.filename
      );
    });
  }
  public ShowDataList() {
    this.m_RowDataList.forEach((d, i) => {
      console.log("row " + i + ":" + "data:" + d.Fields.toString());
    });
  }
  /**
     * SetName
    name : string     */
  public SetName(name: string) {
    this.m_Name = name;
  }
  /**
   * GetName
   */
  public GetName() {
    return this.m_Name;
  }
}

export { DbCore };
