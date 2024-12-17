import "reflect-metadata";
import { DataSource } from "typeorm";
import { Client } from "./entity/Client";
import { Billing } from "./entity/KttBilling";
import { Key } from "./entity/Key";

export const AppDataSource = new DataSource({
  type: (process.env.DB_TYPE as any) || "mysql",
  charset: "utf8mb4",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "test",
  synchronize: true,
  logging: false,
  entities: [Client, Billing, Key],
  migrations: [],
  subscribers: [],
});
