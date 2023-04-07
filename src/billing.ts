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
import fs from "fs"
import { RowData } from "./table";

class Bill extends DbCore {
  /**
   * LoadFromFile
   */
  public async LoadFromFile(filename: string) {
    const workbook = new Excel.Workbook();
    const content = await workbook.xlsx.readFile(filename);
    const worksheet = content.worksheets[0];
    for (let i = 2; i < worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      //let rowContent = "row" + i;
      let data: RowData = {Fields : new Array(0)}
      row.eachCell((cell) => {
        data.Fields.push(cell.value)
        //rowContent += ":" + cell.toString();
      });
      this.InsertData(data)
      //console.log(rowContent);
    }
  }
  public async InitHeaderList(filename: string) {
    const filePath = path.resolve(__dirname, filename);
    const da = JSON.parse(fs.readFileSync(filePath,"utf-8"))
    /*for(let i=0; i< da.headers.length; i++ ) {
      console.log("items[" + i + "]" + da.headers[i].name + da.headers[i].datatype)
    }*/
    this.SetHeaderList(da.headers)
  }
}
export { Bill };
