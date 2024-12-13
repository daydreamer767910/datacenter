import { Repository } from "typeorm";
import { AppDataSource } from "./data-source"; // 引入已定义的数据源
import { Key } from "./entity/Key";
import * as crypto from "crypto";

export class KeyMng {
  private keyRepo: Repository<Key>;
  private encryptionSecret: string;
  private algorithm: string;

  constructor() {
    this.keyRepo = AppDataSource.getRepository(Key);
    this.encryptionSecret = process.env.ENCRYPTION_SECRET || "default_secret_key";
    this.algorithm = "aes-256-cbc";
  }

  /**
   * 加密密钥
   * @param key 明文密钥
   * @returns 加密后的密钥字符串
   */
  encryptKey(key: string): string {
    const iv = crypto.randomBytes(16); // 初始化向量
    const cipher = crypto.createCipheriv(this.algorithm, this.getSecretKey(), iv);
    let encrypted = cipher.update(key, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  }

  /**
   * 解密密钥
   * @param encryptedKey 加密后的密钥字符串
   * @returns 解密后的明文密钥
   */
  decryptKey(encryptedKey: string): string {
    const [ivHex, encrypted] = encryptedKey.split(":");
    const decipher = crypto.createDecipheriv(this.algorithm, this.getSecretKey(), Buffer.from(ivHex, "hex"));
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  /**
   * 保存密钥到数据库
   * @param name 密钥名称
   * @param key 明文密钥
   * @returns 保存的 Key 实体
   */
  async saveKey(name: string, key: string): Promise<Key> {
    const encryptedKey = this.encryptKey(key);
    
    // 检查是否已经存在同名的 key
    let keyEntry = await this.keyRepo.findOne({ where: { name } });

    if (keyEntry) {
        // 如果存在，更新 key
        keyEntry.key = encryptedKey;
        keyEntry.date = new Date();
    } else {
        // 如果不存在，创建新的 key
        keyEntry = this.keyRepo.create({ name, key: encryptedKey, date: new Date() });
    }

    // 保存（插入或更新）
    return await this.keyRepo.save(keyEntry);
	}


  /**
   * 根据 名称获取解密后的密钥
   * @param name 密钥的名称
   * @returns 包含名称、明文密钥和日期的对象
   */
  async getKeyByName(name: string): Promise<{ name: string; key: string; date: Date }> {
    const keyEntry = await this.keyRepo.findOneBy({ name });
    if (!keyEntry) throw new Error("Key not found");
    const decryptedKey = this.decryptKey(keyEntry.key);
    return { name: keyEntry.name, key: decryptedKey, date: keyEntry.date };
  }

  /**
   * 根据名称删除密钥
   * @param name 密钥的名称
   */
  async deleteKeyByName(name: string): Promise<void> {
    const result = await this.keyRepo.delete({ name });
    if (result.affected === 0) throw new Error("Key not found or already deleted");
  }

  /**
   * 获取加密用的密钥
   * @returns Buffer 类型的加密密钥
   */
  private getSecretKey(): Buffer {
    return crypto.createHash("sha256").update(this.encryptionSecret).digest();
  }
}
