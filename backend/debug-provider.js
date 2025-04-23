require("dotenv").config();
const crypto = require("crypto");
const ALGORITHM = "aes-256-cbc";
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: console.log
  }
);

async function main() {
  try {
    await sequelize.authenticate();
    console.log("데이터베이스 연결 성공");
    
    // 암호화 키 가져오기
    const [encKeyResult] = await sequelize.query(
      "SELECT value FROM system_configs WHERE key = 'ENCRYPTION_KEY'"
    );
    
    if (encKeyResult.length === 0) {
      throw new Error("암호화 키를 DB에서 찾을 수 없습니다.");
    }
    
    const ENCRYPTION_KEY = encKeyResult[0].value;
    console.log("DB에서 암호화 키를 가져왔습니다.");

    const [providers] = await sequelize.query(
      `SELECT id, name, type, "apiKey" FROM providers WHERE id = 'b64d691e-56a0-4eba-87fe-f189efdecded'`
    );
    console.log("제공업체:", providers);

    const decrypt = (encryptedText) => {
      try {
        const parts = encryptedText.split(":");
        if (parts.length !== 2) {
          throw new Error("잘못된 암호화 형식");
        }
        const iv = Buffer.from(parts[0], "hex");
        const encrypted = parts[1];
        
        // DB에서 가져온 base64 형식의 키 사용
        const key = Buffer.from(ENCRYPTION_KEY, "base64").slice(0, 32);
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
      } catch (error) {
        console.error("복호화 오류:", error);
        throw error;
      }
    };

    if (providers.length > 0) {
      const provider = providers[0];
      console.log("암호화된 API 키:", provider.apiKey);
      try {
        const decryptedKey = decrypt(provider.apiKey);
        console.log("복호화된 API 키:", decryptedKey);
      } catch (e) {
        console.error("API 키 복호화 오류:", e);
      }
    }

    await sequelize.close();
  } catch (error) {
    console.error("오류 발생:", error);
  }
}

main();
