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
import { RowData } from "./table";


class Bill extends DbCore {
  private static m_List: Map<string,Bill> = new Map()
  public static GetBill(name:string) {
    return Bill.m_List.get(name)
  }
  constructor(name: string) {
    super(name)
    Bill.m_List.set(name,this)
  }
  /**
   * SaveToFile()
   */
  public async SaveToFile(filename: string) {
    const workbook = new Excel.Workbook();
    workbook.creator = this.m_Config.author
    try {
      let worksheet = workbook.addWorksheet(this.m_Config.sheetid)
      
      worksheet.columns = this.m_Config.headers
      //console.log(worksheet.columns)
  
      for( let i=2;i< this.m_RowDataList.length+2; i++) {
        worksheet.getRow(i).values = this.m_RowDataList[i-2].Fields
      }
      workbook.xlsx.writeFile(filename)
    } catch(e) {
      console.error(e)
    }
  }
  /**
   * LoadFromFile
   */
  public async LoadFromFile(filename: string, sheetid: number|string) {
    const workbook = new Excel.Workbook();
    try {
      //await workbook.csv.readFile(filename)
      let ret = this.m_RowDataList.length
      await workbook.xlsx.readFile(filename)
      let worksheet = workbook.getWorksheet(sheetid)//workbook.worksheets[sheetid]
      
      let row = worksheet.getRow(1);// header
      let cols = this.m_Config.headers.map(() => 0)
      //match the bill headers with the file headers
      row.eachCell((cell,i) => {
        for( let j=0;j< this.m_Config.headers.length; j++) {
          if(this.m_Config.headers[j].datasrc?.name === cell.toString()) {
            cols[j] = i
            //console.log(`col[${j}] = [${col}] name:${this.m_HeaderList[j].name}`)
          }
        }
      })
      for (let i = 2; i < worksheet.rowCount+1; i++) {
        row = worksheet.getRow(i);
        let data: RowData = { Fields: new Array(0) };
        cols.forEach( (col: number,j: number) => {
          let value = null
          if(col > 0){
            value = row.getCell(col).value
          }
          if(value) {
            switch(this.m_Config.headers[j].datatype.toLowerCase()) {
              case 'string':
                let regex = this.m_Config.headers[j].datasrc?.regex
                value = regex ? value.toString().match(new RegExp(regex,"g")) : value
                data.Fields.push(value?.toString())
                break;
              case 'boolean':
                data.Fields.push(Boolean(value))
                break;
              case 'number':
                data.Fields.push(Number(value))
                break;
              case 'object':
              case 'any':
              default:
                data.Fields.push(value)
                break;
            }
            
          } else {
            data.Fields.push(this.m_Config.headers[j].default);
          }
        })
        //console.log("datasize is:"+data.Fields.length)
        if(this.InsertData(data) <=0){
          console.log("insert row[" + i +"]" + data.Fields.toString()+" failed")
        }
      }
      return this.m_RowDataList.length - ret
    } catch(e) {
      console.error(e)
    }
  }
  public SortData(x: number | string) {
    let idx = -1;
    if (typeof x === "string") {
      idx = this.m_Config.headers.findIndex((h: { header: string }) => {
        return h.header === x;
      });
      //console.log("--------------"+ x + "idx:" + idx)
    } else if (typeof x === "number") {
      idx = x;
    }

    if (idx >= 0 && this.m_RowDataList.length > 1) {
      this.m_RowDataList.sort((a, b) => {
        let ret = 0
        switch(this.m_Config.headers[idx].datatype.toLowerCase()) {
          case 'string':
            ret = a.Fields.at(idx) < b.Fields.at(idx) ? -1 : 1
            break;
          case 'number':
            ret = a.Fields.at(idx) - b.Fields.at(idx)
            break;
          case 'object':
          case 'any':
          default:
            break;
        }
        //console.log("--------------field["+ idx + "] :" + a.Fields.at(idx))
        return ret
      });
    }
  }  
}
export { Bill };
