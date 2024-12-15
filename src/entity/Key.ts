import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Key {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 2048 })
  key: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  date: Date;
}
