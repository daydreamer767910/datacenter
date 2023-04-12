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
  protected m_Config :any
  protected constructor(name: string) {
    this.m_Name = name;
    this.m_RowDataList = new Array(0);
  }
  public SetConfig(config: any) {
    this.m_Config = config
  }
  
  public GetHeaderSize() {
    return this.m_Config.headers.length;
  }
  
  public GetDataSize() {
    return this.m_RowDataList.length;
  }

  public GetHeaderNames() {
    return this.m_Config.headers.map((h: { header: string }) => h.header)
  }

  public GetHeaderKeys() {
    return this.m_Config.headers.map((k: { key: string }) => k.key)
  }

  public GetDataFieldsByNames(RowId: number, FieldNames: string[]) {
    let rowdata = this.GetData(RowId)
    let fieldids = new Array<any>(FieldNames.length)
    
    FieldNames.forEach((v,i) => {
      this.m_Config.headers.forEach((h: { header: string; },j: number) => {
        if(v === h.header) {
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
    if (data.Fields.length != this.m_Config.headers.length) {
      console.log(`data structure wrong:expected[${this.m_Config.headers.length}]while[${data.Fields.length}]`)
      return false
    }
    for(let i = 0; i< this.m_Config.headers.length; i++) {
      let datetype = this.m_Config.headers[i].datatype
      if ( datetype != "any" && datetype != typeof data.Fields.at(i)) {
        console.log(`field[${i}]name[${this.m_Config.headers[i].header}]error:required type:${datetype}-->while type:${typeof data.Fields.at(i)} :data[${data.Fields.at(i)}]`)
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
    console.log(this.m_Config.headers)
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
