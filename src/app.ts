import { Bill } from "./billing";
import * as path from "path";
import * as fs from "fs"

async function paidan(srcDir: string, dstDir: string) {
    const bill = new Bill("bill");
    bill.InitHeaderList("billconfig.json");
    try {
        const files = await fs.promises.readdir(srcDir);
        files.forEach((file) => {
            //if(file.match(/\S*.xlsx|\S*.xls|\S*.csv/)){
            if(file.match(/\S*.xlsx/)){
                bill.LoadFromFile(path.resolve(srcDir,file),1).then(() => {
                    //console.log("---------------------------------------------------------");
                    bill.ShowDataList();
                    //bill.SortData("联系电话");
                    //bill.DeleteData(0,1)
                    //bill.ShowDataList();
                });
            }
        })
    } catch (error) {
        console.error("Error occurred while reading the directory!", error);
    }
    //bill.ShowHeadList();
    
}

function huidan(srcDir: string, dstDir: string) {

}

export {paidan, huidan}