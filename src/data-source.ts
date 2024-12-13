import "reflect-metadata";
import { DataSource } from "typeorm";
import { Client } from "./entity/Client";
import { Billing } from "./entity/KttBilling";
import { Key } from "./entity/Key"

export const AppDataSource = new DataSource({
  type: "mysql",
  charset: "utf8mb4",
  host: process.env.DB_HOST || 'host.docker.internal',
  port: 3306,
  username: "root",
  password: "12345678",
  database: "kttdatabase",
  synchronize: true,
  logging: false,
  entities: [Client, Billing, Key],
  migrations: [],
  subscribers: [],
});
