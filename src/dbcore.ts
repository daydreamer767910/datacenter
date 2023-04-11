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
  public GetHeaderNames() {
    let names = new Array<string>(this.m_HeaderList.length)
    this.m_HeaderList.forEach((h,i) => {
      names[i] = h.name
    })
    return names
  }
  public GetDataFieldsByNames(idx: number, FieldNames: string[]) {
    let rowdata = this.GetData(idx)
    let fieldids = new Array<any>(FieldNames.length)
    
    FieldNames.forEach((v,i) => {
      this.m_HeaderList.forEach((h,j) => {
        if(v === h.name) {
          fieldids[i] = rowdata?.Fields[j]
          return
        }
      })
    })
    return fieldids
  }
  public GetData(idx: number) {
    if(idx > this.m_RowDataList.length)
      return null
    return this.m_RowDataList[idx]
  }
  private CheckRowData(data: RowData) {
    if (data.Fields.length != this.m_HeaderList.length) {
      console.log(`data structure wrong:expected[${this.m_HeaderList.length}]while[${data.Fields.length}]`)
      return false
    }
    for(let i = 0; i< this.m_HeaderList.length; i++) {
      let datetype = this.m_HeaderList[i].datatype
      if ( datetype != "any" && datetype != typeof data.Fields.at(i)) {
        console.log(`field[${i}]name[${this.m_HeaderList[i].name}]error:required type:${datetype}-->while type:${typeof data.Fields.at(i)} :data[${data.Fields.at(i)}]`)
        return false
      }
    }
    return true;
  }
  public InsertData(data: RowData) {
    if (!this.CheckRowData(data)) return 0;
    return this.m_RowDataList.push(data)
  }
  public DeleteData(idx: number, num = 1) {
    const d = this.m_RowDataList.slice(idx, idx + num);
    this.m_RowDataList.copyWithin(idx, idx + num);
    for (let i = 0; i < num; i++) this.m_RowDataList.pop();
    return d;
  }
  public ShowHeadList() {
    this.m_HeaderList.forEach((h, i) => {
      console.log(`head field[${i}] :name:${h.name} type:${h.datatype} srcname:${h.datasrc?.name} srcreg:${h.datasrc?.regex}`)
    });
  }
  public ShowDataList() {
    this.m_RowDataList.forEach((d, i) => {
      console.log("row " + i + ":" + "data:" + d.Fields.toString());
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
