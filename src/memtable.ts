import fs from "fs";

export interface Row {
  [key: string]: any; // 动态字段，每列一个值
}

export interface Column {
  name: string; // 列名
  type: string; // 数据类型
  nullable?: boolean; // 是否允许空值
  defaultValue?: any; // 默认值
  primaryKey?: boolean; // 是否是主键
}

type Index = Map<string, Map<any, number[]>>;

export interface Table {
  name: string; // 表名
  columns: Column[]; // 列定义
  insertRow(row: Row): boolean;
  insertRows(rows: Row[]): boolean;
  getRows(): Row[];
  addIndex(columnName: string): Index;
}

export interface TableConfig {
  tables: {
    name: string;
    columns: Column[];
  }[];
}

export class MemTable implements Table {
  name: string;
  columns: Column[];
  rows: Row[];
  private index?: Index; // 可选：索引，用于加速查询

  constructor(name: string, columns: Column[]) {
    if (!name || !columns) {
      throw new Error("Invalid table structure in JSON.");
    }
    const columnNames = new Set<string>();
    columns.forEach((column) => {
      if (!column.name || !column.type) {
        throw new Error("Each column must have a name and a type.");
      }
      if (columnNames.has(column.name)) {
        throw new Error(`Duplicate column name: ${column.name}`);
      }
      columnNames.add(column.name);
    });
    this.name = name;
    this.columns = columns;
    this.rows = [];
    this.index = new Map();
  }

  private isValidType(value: any, type: string): boolean {
    if (type === "array") return Array.isArray(value);
    if (type === "date") return value instanceof Date;
    return typeof value === type;
  }
  /**
   * 验证行是否符合表结构定义
   * @param row - 待验证的行
   */
  public validateRow(row: Row): boolean {
    for (const column of this.columns) {
      const value = row[column.name];
      if (!column.nullable && (value === undefined || value === null)) {
        throw new Error(`Missing required field: ${column.name}`);
      }
      if (
        value !== null &&
        value !== undefined &&
        !this.isValidType(value, column.type)
      ) {
        throw new Error(`Invalid type for field: ${column.name}`);
      }
    }
    return true;
  }

  /**
   * 验证行数据是否符合主键唯一性要求
   * @param row - 待插入的行
   */
  private validatePrimaryKey(row: Row): boolean {
    const primaryKeyColumn = this.columns.find((col) => col.primaryKey);
    if (primaryKeyColumn) {
      const primaryKeyValue = row[primaryKeyColumn.name];
      if (primaryKeyValue !== undefined && primaryKeyValue !== null) {
        // 检查主键值是否已经存在
        const existingRow = this.rows.find(
          (existingRow) =>
            existingRow[primaryKeyColumn.name] === primaryKeyValue
        );
        if (existingRow) {
          throw new Error(
            `Primary key value "${primaryKeyValue}" already exists.`
          );
        }
      }
    }
    return true;
  }

  /**
   * 插入一行数据
   * @param row - 要插入的行
   */
  public insertRow(row: Row): boolean {
    const newRow = this.processRowDefaults(row);
    if (this.validateRow(newRow) && this.validatePrimaryKey(newRow)) {
      this.rows.push(newRow);
      this.updateIndexes(newRow, this.rows.length - 1);
      return true;
    }
    return false;
  }

  /**
   * 批量插入行
   * @param rows - 要插入的行数组
   */
  public insertRows(rows: Row[]): boolean {
    const startIdx = this.rows.length;

    // 临时存储有效的行
    const validRows: Row[] = [];

    // 首先校验每一行数据
    for (const row of rows) {
      const newRow = this.processRowDefaults(row);
      if (this.validateRow(newRow) && this.validatePrimaryKey(newRow)) {
        validRows.push(newRow);
      }
    }

    // 如果没有有效行，直接返回
    if (validRows.length === 0) {
      return false;
    }

    // 批量插入有效行
    this.rows.push(...validRows);

    // 批量更新索引
    this.index?.forEach((index, columnName) => {
      validRows.forEach((row, idx) => {
        const value = row[columnName];
        const rowIndex = startIdx + idx;
        if (!index.has(value)) {
          index.set(value, []);
        }
        index.get(value)?.push(rowIndex);
      });
    });

    return true;
  }

  public getRows(): Row[] {
    return this.rows;
  }

  /**
   * 处理行的默认值
   * @param row - 输入行
   */
  private processRowDefaults(row: Row): Row {
    const newRow: Row = {};
    for (const column of this.columns) {
      const value = row[column.name] ?? column.defaultValue;
      newRow[column.name] = value;
    }
    return newRow;
  }

  /**
   * 更新索引
   * @param row - 被更新的行
   * @param rowIndex - 行索引
   */
  private updateIndexes(row: Row, rowIndex: number): void {
    this.index?.forEach((index, columnName) => {
      const value = row[columnName];
      if (!index.has(value)) {
        index.set(value, []);
      }
      index.get(value)?.push(rowIndex);
    });
  }

  /**
   * 添加单列索引
   * @param columnName - 索引列名
   */
  public addIndex(columnName: string): Index {
    const index = new Map<any, number[]>();
    this.rows.forEach((row, idx) => {
      const value = row[columnName];
      if (!index.has(value)) {
        index.set(value, []);
      }
      index.get(value)?.push(idx);
    });
    this.index?.set(columnName, index);
    return this.index;
  }

  /**
   * 根据索引查询数据
   * @param columnName - 索引列名
   * @param value - 查询值
   */
  public queryByIndex(columnName: string, value: any): Row[] {
    const index = this.index?.get(columnName);
    if (!index) throw new Error(`No index found for column ${columnName}`);
    const rowIndexes = index.get(value) || [];
    return rowIndexes.map((idx) => this.rows[idx]);
  }

  public addCompositeIndex(columns: string[]): void {
    const index = new Map<string, number[]>();
    this.rows.forEach((row, idx) => {
      const key = columns.map((col) => row[col]).join("_");
      if (!index.has(key)) {
        index.set(key, []);
      }
      index.get(key)?.push(idx);
    });
    this.index?.set(columns.join("_"), index);
  }
  /**
   * 根据索引查询数据
   * @param columnName - 索引列名
   */
  public selectDistinct(columnName: string): Set<any> {
    const index = this.index?.get(columnName);
    if (!index) throw new Error(`No index found for column ${columnName}`);

    const distinctValues = new Set<any>();

    // 遍历索引，获取唯一的列值
    index.forEach((_, value) => {
      distinctValues.add(value);
    });

    return distinctValues;
  }

  public groupBy(columnName: string): Map<any, number> {
    const index = this.index?.get(columnName);
    if (!index) throw new Error(`No index found for column ${columnName}`);

    const result = new Map<any, number>();

    // 遍历索引，统计每个值的行数
    index.forEach((rowIndexes, value) => {
      result.set(value, rowIndexes.length);
    });

    return result;
  }

  public exportToFile(filePath: string): void {
    const tableData = JSON.stringify(
      {
        name: this.name,
        columns: this.columns,
        rows: this.rows,
      },
      null,
      2
    );
    fs.writeFileSync(filePath, tableData);
  }

  public importFromFile(filePath: string): void {
    // 读取文件内容
    const tableData = fs.readFileSync(filePath, "utf-8");

    // 将文件内容解析为 JSON 对象
    const parsedData = JSON.parse(tableData);

    // 恢复表格的数据
    this.name = parsedData.name;
    this.columns = parsedData.columns;
    this.rows = parsedData.rows;
  }
}
