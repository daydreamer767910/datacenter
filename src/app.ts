import { Bill } from "./billing";
import * as path from "path";
import * as fs from "fs"
import { RowData } from "./table";

const billconfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, "billconfig.json"), "utf-8"))
const dailybill = JSON.parse(fs.readFileSync(path.resolve(__dirname, "dailybill.json"), "utf-8"))

async function load_allbills(srcDir: string) {
    try {
        const bill = new Bill(billconfig.name)
        bill.SetConfig(billconfig)
        //bill.SetHeaderList(billconfig.headers)
        let files = fs.readdirSync(srcDir)
        for(let file of files) {
            if(file.match(/\S*.xlsx|\S*.csv|\S*.xls\b/)) {
                console.log(`start to load ${file}`)
                await bill.LoadFromFile(path.resolve(srcDir,file),billconfig.input.sheetid)
                .then((num)=>console.log(`${num?num:0} rows are loaded`))
            }
        }
        bill.SortData('团购标题')
        
    } catch (error) {
        console.error("Error occurred while reading the directory!", error);
    }
}
async function dispatch_bills(dstDir: string) {
    
    const srcbill = Bill.GetBill(billconfig.name)
    if(!srcbill)
        return -1
    //await srcbill.SaveToFile(path.resolve(dstDir,billconfig.name+'.xlsx'))
    //srcbill.ShowDataList()
    try {
        const bill = new Bill(dailybill.name)
        bill.SetConfig(dailybill)
        //bill.SetHeaderList(dailybill.headers)
        for(let i=0;i<srcbill.GetDataSize();i++) {
            let rowdata : RowData = {Fields : srcbill.GetDataFieldsByNames(i,bill.GetHeaderNames()) }
            bill.InsertData(rowdata)
        }
        await bill.SaveToFile(path.resolve(dstDir,dailybill.name+'.xlsx'))
    } catch (error) {
        console.error("Error occurred while reading the directory!", error);
    }
}
function paidan(srcDir: string, dstDir: string) {
    load_allbills(srcDir)
    .then(()=>{
        console.log("---------------------------------------------------------")
        dispatch_bills(dstDir)
        .then(()=>{

        })
    })
}

function huidan(srcDir: string, dstDir: string) {

}

export {paidan, huidan}