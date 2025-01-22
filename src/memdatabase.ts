import { TableConfig, Column, MemTable } from "./memtable";
//import {ObjDatasrc} from './odata-source'

class MemDatabase {
  private tables: Map<string, MemTable> = new Map();
  //private dataSrc: ObjDatasrc = new ObjDatasrc();

  public async initialize(config: TableConfig) {
    config.tables.forEach(async (table) => {
      console.log(table);
      this.addTable(table.name, table.columns);
    });
  }
  /**
   * Add a new table to the database.
   * @param table - The table to add.
   * @throws Error if a table with the same name already exists.
   */
  addTable(tableName: string, columns: Column[]): void {
    if (this.tables.has(tableName)) {
      throw new Error(`Table ${tableName} already exists.`);
    }
    const objTable = new MemTable(tableName, columns);
    this.tables.set(tableName, objTable);
  }

  /**
   * Retrieve a table by its name.
   * @param tableName - The name of the table.
   * @returns The table instance or null if not found.
   */
  getTable(tableName: string): MemTable | null {
    return this.tables.get(tableName) || null;
  }

  /**
   * Update an existing table.
   * @param table - The updated table instance.
   * @throws Error if the table does not exist.
   */
  updateTable(table: MemTable): void {
    if (!this.tables.has(table.name)) {
      throw new Error(`Table ${table.name} does not exist.`);
    }
    this.tables.set(table.name, table);
  }

  /**
   * Remove a table by its name.
   * @param tableName - The name of the table to remove.
   * @throws Error if the table does not exist.
   */
  removeTable(tableName: string): void {
    if (!this.tables.has(tableName)) {
      throw new Error(`Table ${tableName} does not exist.`);
    }
    this.tables.delete(tableName);
  }

  /**
   * List all table names in the database.
   * @returns An array of table names.
   */
  listTableNames(): string[] {
    return Array.from(this.tables.keys());
  }

  /**
   * Get all table instances in the database.
   * @returns An array of MemTable instances.
   */
  listTables(): MemTable[] {
    return Array.from(this.tables.values());
  }
}
export const objDatabase = new MemDatabase();
