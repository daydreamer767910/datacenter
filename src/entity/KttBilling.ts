import { Entity, PrimaryGeneratedColumn, Column, Unique } from "typeorm";

@Entity()
@Unique(["id", "product"]) // 定义联合唯一约束，列名以数组形式传递
export class Billing {
  @PrimaryGeneratedColumn()
  pk: number;

  @Column()
  id: string;

  @Column({ default: "unknown" })
  providerid: string;

  @Column({ type: "varchar", length: 25 })
  productid: string;

  @Column({ nullable: false })
  product: string;

  @Column()
  productcode: string;

  @Column()
  category: string;

  @Column()
  specs: string;

  @Column()
  num: number;

  @Column()
  cost: number;

  @Column()
  freight: number;

  @Column({ nullable: false })
  price: number;

  @Column()
  profit: number;

  @Column()
  refund: number;

  @Column()
  date: string;

  @Column()
  leader: string;

  @Column()
  comment: string;

  @Column({ nullable: false })
  client: string;

  @Column({ nullable: false })
  phone: string;

  @Column()
  province: string;

  @Column()
  city: string;

  @Column()
  district: string;

  @Column({ nullable: false })
  addr: string;

  @Column()
  couriersn: string;

  @Column()
  status: string;

  public initialize() {
    this.addr = "";
    this.category = "";
    this.city = "";
    this.client = "";
    this.comment = "";
    this.cost = 0;
    this.couriersn = "";
    this.date = "";
    this.district = "";
    this.freight = 0;
    this.id = "";
    this.leader = "";
    this.num = 0;
    this.phone = "";
    this.price = 0;
    this.product = "";
    this.productcode = "";
    this.productid = "";
    this.profit = 0;
    this.providerid = "";
    this.province = "";
    this.refund = 0;
    this.specs = "";
    this.status = "";
  }
}
