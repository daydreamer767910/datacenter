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
import * as path from "path";
import fs from "fs";
import { RowData } from "./table";

class Bill extends DbCore {
  constructor(name: string) {
    super(name);
  }
  /**
   * LoadFromFile
   */
  public async LoadFromFile(filename: string, sheetid: number = 0) {
    const workbook = new Excel.Workbook();
    try {
      await workbook.xlsx.readFile(filename)
      let worksheet = workbook.worksheets[sheetid]
      let row = worksheet.getRow(1);// header
      let collist = new Array<number>(this.m_HeaderList.length)
      for(let j=0;j<collist.length; j++) {
        collist[j] = 0
      }
      row.eachCell((cell,col) => {
        for( let j=0;j< this.m_HeaderList.length; j++) {
          if(this.m_HeaderList[j].datasrc?.name === cell.toString()) {
            collist[j] = col
            //console.log(`col[${j}] = [${col}] name:${this.m_HeaderList[j].name}`)
          }
        }
      })
      for (let i = 2; i < worksheet.rowCount; i++) {
        row = worksheet.getRow(i);
        let data: RowData = { Fields: new Array(0) };
        collist.forEach( (col,j) => {
          let value = null
          if(col > 0){
            let regex = this.m_HeaderList[j].datasrc?.regex
            value = regex ? row.getCell(col).value?.toString().match(new RegExp(regex,"g")) : row.getCell(col).value
          }
          if(value) {
            data.Fields.push(value)
          } else {
            data.Fields.push(this.m_HeaderList[j].default);
          }
        })
        //console.log("datasize is:"+data.Fields.length)
        if(this.InsertData(data) <=0){
          console.log("insert row[" + i +"]" + data.Fields.toString()+" failed")
        }
      }
    } catch(e) {
      console.log('load data from file error:' +e)
    }
  }
  public SortData(x: number | string) {
    let idx = -1;
    if (typeof x === "string") {
      idx = this.m_HeaderList.findIndex((obj) => {
        return obj.name === x;
      });
      //console.log("--------------"+ x + "idx:" + idx)
    } else if (typeof x === "number") {
      idx = x;
    }

    if (idx >= 0 && this.m_RowDataList.length > 1) {
      this.m_RowDataList.sort((a, b) => {
        //console.log("--------------field["+ idx + "] :" + a.Fields.at(idx))
        return a.Fields.at(idx) - b.Fields.at(idx);
      });
    }
  }

  public async InitHeaderList(filename: string) {
    const filePath = path.resolve(__dirname, filename);
    const da = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    /*for(let i=0; i< da.headers.length; i++ ) {
      console.log("items[" + i + "]" + da.headers[i].name + da.headers[i].datatype)
    }*/
    this.SetHeaderList(da.headers);
  }
}
export { Bill };
