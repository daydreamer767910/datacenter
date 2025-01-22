import fs from "fs";
import xlsx from "xlsx";
import csvParser from "csv-parser";
import { compileExpression } from "filtrex"; // 用于解析和执行表达式
import { Row, MemTable } from "./memtable";
import { objDatabase } from "./memdatabase";
import fetch from "node-fetch";

enum TransformType {
  EXCEL = "excel",
  CSV = "csv",
  JSON = "json",
  DATABASE = "database",
  API = "api",
}

interface TransformDock {
  name: string;
  type: TransformType;
  path?: string; // 对于文件
  sheetName?: string; // 对于 Excel
  query?: string; // 对于数据库
  apiUrl?: string; // 对于 API
}

interface Mapping {
  target: string;
  source: { name: string; field: string };
  transform?: string | { value: string };
}

interface DataSourceConfig {
  sources: TransformDock[];
  inmemory: {
    table: string;
    mappings: Mapping[];
  }[];
}

interface DataDestinationConfig {
  destinations: TransformDock[];
  inmemory: {
    destination: string;
    mappings: Mapping[];
  }[];
}

export class DataTransformer {
  private functionRegistry: { [key: string]: (price: number) => number };

  constructor() {
    this.functionRegistry = {
      calculateDiscount: (price) => price * 0.9,
    };
  }

  async loadDataSource(config: TransformDock): Promise<Row[]> {
    const rows = await this.processTransformDock(config);
    return rows as Row[];
  }

  private async loadFromExcel(filePath: string): Promise<Row[]> {
    const workbook = xlsx.readFile(filePath); // 同步读取文件
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("Excel file does not contain any sheets.");
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found.`);
    }

    // 转换为 JSON 数据
    const rows: Row[] = xlsx.utils.sheet_to_json<Row>(sheet);
    return rows; // 返回 Promise
  }

  private async loadFromCsv(filePath: string): Promise<Row[]> {
    const rows: Row[] = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (row: Row) => rows.push(row))
        .on("end", () => resolve(rows))
        .on("error", reject);
    });
  }

  private loadFromJSON(filePath: string): Promise<Row[]> {
    const rawData = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(rawData);
  }

  private async loadFromDatabase(query: string): Promise<Row[]> {
    const knex = require("knex")({
      client: process.env.DB_TYPE,
      connection: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      },
      pool: { min: 2, max: 10 },
    });
    return await knex.raw(query).then((result: any) => result[0]);
  }

  private async loadFromApi(apiUrl: string): Promise<Row[]> {
    const response = await fetch(apiUrl);
    return await response.json();
  }

  private saveToExcel(filePath: string, rows: Row[], sheetName: string): void {
    // 将数据转换为工作簿格式
    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);

    // 写入到 Excel 文件
    xlsx.writeFile(workbook, filePath);
  }

  private async sendToApi(apiUrl: string, rows: Row[]): Promise<void> {
    for (const row of rows) {
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
    }
  }

  private saveToJSON(filePath: string, rows: Row[]): void {
    const data = JSON.stringify(rows, null, 2);
    fs.writeFileSync(filePath, data, "utf-8");
  }

  private async saveToDatabase(query: string, rows: Row[]): Promise<void> {
    const knex = require("knex")({
      client: process.env.DB_TYPE,
      connection: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      },
      pool: { min: 2, max: 10 },
    });

    for (const row of rows) {
      await knex.raw(query, row);
    }
  }

  private transformRows(
    mappings: Mapping[],
    dataSources: { [key: string]: Row[] }
  ): Row[] {
    // 确定所有源表
    const uniqueSources = Array.from(
      new Set(mappings.map((mapping) => mapping.source?.name).filter(Boolean))
    );

    // 检查数据源是否存在
    uniqueSources.forEach((sourceName) => {
      if (!dataSources[sourceName]) {
        throw new Error(
          `Source table "${sourceName}" not found in dataSources.`
        );
      }
    });

    // 假设结果以第一个映射的表为基础生成（可以更灵活处理）
    const primarySourceName = mappings[0].source?.name;
    const primarySourceRows = dataSources[primarySourceName];

    // 转换每一行
    return primarySourceRows.map((primaryRow) =>
      mappings.reduce((transformedRow, mapping) => {
        const { target, source, transform } = mapping;
        const matchingRow = dataSources[source?.name]?.find(
          (row) => row[source.field] === primaryRow[source.field]
        );
        let value = matchingRow?.[source.field];

        if (transform) {
          value =
            typeof transform === "string"
              ? compileExpression(transform)(value)
              : this.functionRegistry[transform.value](value);
        }

        transformedRow[target] = value;
        return transformedRow;
      }, {} as Row)
    );
  }

  async loadTables(sourceConfig: DataSourceConfig): Promise<MemTable[]> {
    const sources: { [key: string]: Row[] } = {};
    for (const source of sourceConfig.sources) {
      sources[source.name] = await this.loadDataSource(source);
    }
    return sourceConfig.inmemory.map((mappingConfig) => {
      const table = objDatabase.getTable(mappingConfig.table);
      if (!table) {
        throw new Error(`table ${mappingConfig.table} not found`);
      }
      const rows = this.transformRows(mappingConfig.mappings, sources);
      table.insertRows(rows);
      return table;
    });
  }

  async saveTables(destConfig: DataDestinationConfig) {
    const sources: { [key: string]: Row[] } = {};
    for (const table of objDatabase.listTables()) {
      sources[table.name] = table.getRows();
    }
    for (const mappingConfig of destConfig.inmemory) {
      const destination = destConfig.destinations.find(
        (dest) => dest.name === mappingConfig.destination
      );
      if (!destination) {
        throw new Error(`Destination ${mappingConfig.destination} not found`);
      }

      const rowsToSave = this.transformRows(mappingConfig.mappings, sources);

      await this.processTransformDock(destination, rowsToSave);
    }
  }

  private handlers: {
    [key in TransformType]: (
      config: TransformDock,
      rows?: Row[]
    ) => Promise<Row[] | void>;
  } = {
    [TransformType.EXCEL]: async (config, rows) =>
      rows
        ? this.saveToExcel(config.path!, rows, config.sheetName)
        : this.loadFromExcel(config.path!),
    [TransformType.CSV]: async (config, rows) =>
      rows
        ? this.saveToJSON(config.path!, rows)
        : this.loadFromCsv(config.path!),
    [TransformType.JSON]: async (config, rows) =>
      rows ? null : this.loadFromJSON(config.path!),
    [TransformType.DATABASE]: async (config, rows) =>
      rows
        ? this.saveToDatabase(config.query!, rows)
        : this.loadFromDatabase(config.query!),
    [TransformType.API]: async (config, rows) =>
      rows
        ? this.sendToApi(config.apiUrl!, rows)
        : this.loadFromApi(config.apiUrl!),
  };

  async processTransformDock(
    config: TransformDock,
    rows?: Row[]
  ): Promise<Row[] | void> {
    if (!this.handlers[config.type]) {
      throw new Error(`Unsupported transform type: ${config.type}`);
    }
    try {
      return await this.handlers[config.type](config, rows);
    } catch (error) {
      throw new Error(
        `Error processing transform dock for type ${config.type}: ${error.message}`
      );
    }
  }
}
