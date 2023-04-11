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
import Excel, { Column } from "exceljs";
import { RowData } from "./table";
import { HeaderInfo } from "./table";

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
  public async SaveToFile(filename: string, sheetid: string) {
    const workbook = new Excel.Workbook();
    try {
      let worksheet = workbook.addWorksheet(sheetid)
      for( let j=0;j< this.m_HeaderList.length; j++) {
        worksheet.getRow(1).getCell(j+1).value = this.m_HeaderList[j].name
      }
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
      for (let i = 2; i < worksheet.rowCount+1; i++) {
        row = worksheet.getRow(i);
        let data: RowData = { Fields: new Array(0) };
        collist.forEach( (col,j) => {
          let value = null
          if(col > 0){
            let regex = this.m_HeaderList[j].datasrc?.regex
            value = regex ? row.getCell(col).value?.toString().match(new RegExp(regex,"g")) : row.getCell(col).value
          }
          if(value) {
            switch(this.m_HeaderList[j].datatype.toLowerCase()) {
              case 'string':
                data.Fields.push(value.toString())
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
            data.Fields.push(this.m_HeaderList[j].default);
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
      idx = this.m_HeaderList.findIndex((obj) => {
        return obj.name === x;
      });
      //console.log("--------------"+ x + "idx:" + idx)
    } else if (typeof x === "number") {
      idx = x;
    }

    if (idx >= 0 && this.m_RowDataList.length > 1) {
      this.m_RowDataList.sort((a, b) => {
        let ret = 0
        switch(this.m_HeaderList[idx].datatype.toLowerCase()) {
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
