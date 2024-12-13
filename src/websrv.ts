import express, { Request, Response, Express } from 'express';
import https from 'https';
import fs from 'fs';
import { postMessage } from "./app";
import * as LOG from "./logger";
import { OpenAIClient } from "./openaiclient";
import { KeyMng } from "./keymng";

const Logger = {
  log: (level: string, message: string, ...meta: any[]) =>
    LOG.GetLogger("comm")?.log(level, message, ...meta),
};

class KttWebSrv {
    private app: Express;
    private port: number;
    private server: https.Server;

    constructor(port: number) {
        this.app = express();
        this.port = port;
    }

    public initialize(): void {
        // 读取证书和私钥
        const privateKey = fs.readFileSync('./bin/private.key', 'utf8');
        const certificate = fs.readFileSync('./bin/cert.pem', 'utf8');
        // 中间件：解析 JSON 请求体
        this.app.use(express.json());

        // GET 路由
        this.app.get('/', (req: Request, res: Response) => {
            let rspstr = `use the following commands to:
                1.distribute daily billing:\r\n
                    https://localhost:8080/api \r\n
                2.update the coming back billing:\r\n
                    https://localhost:8080/api \r\n
                3.set AI key:\r\n
                    https://localhost:8080/api/setkey  \r\n
                4.talk to AI:/r/n
                    https://localhost:8080/api/talk`
            res.setHeader('Content-Type', 'text/plain');    
            res.send(`<pre>\r\n${rspstr}\r\n</pre>`);
        });

        // POST 路由
        this.app.post('/api/setkey', async (req: Request, res: Response) => {
            try {
                const { name, key } = req.body;
        
                if (!name || !key) {
                    return res.status(400).send({ error: 'Both name and key are required!' });
                }
        
                const keyMng = new KeyMng();
                const savedKey = await keyMng.saveKey(name.toString(), key.toString());
        
                Logger.log("info", "Saved Key:", savedKey);
                res.status(201).send({ message: "Key saved successfully", key: savedKey });
            } catch (error) {
                Logger.log("error", "Error saving key:", error);
                res.status(500).send({ error: 'Internal server error', details: error.message });
            }
        });
        this.app.post('/api/talk', async (req: Request, res: Response) => {
            const { content } = req.body;
        
            if (!content) {
                return res.status(400).send({ error: 'Action not provided!' });
            }
        
            try {
                // 获取 API 密钥
                const keyMng = new KeyMng();
                const retrievedKey = await keyMng.getKeyByName("API Key");
        
                if (!retrievedKey || !retrievedKey.key) {
                    Logger.log("error", "API Key not found or invalid.");
                    return res.status(500).send({ error: 'API Key not found.' });
                }
        
                // 初始化 OpenAI 客户端
                const openAIClient = new OpenAIClient(retrievedKey.key); // 使用 API 密钥初始化客户端
        
                // 使用 Text Completion 获取响应
                const textResponse = await openAIClient.getCompletion(content);
        
                Logger.log('info', 'Text Completion Response:', textResponse);
                
                // 返回响应
                return res.send({ message: textResponse });
            } catch (error) {
                // 捕获并记录错误
                Logger.log("debug", "Error in OpenAI API request:", error);
        
                // 返回具体的错误信息
                return res.status(500).send({
                    error: 'Failed to talk with AI.',
                    details: error.response?.data?.error?.message || error.message
                });
            }
        });
        this.app.post('/api', async (req: Request, res: Response) => {
            const { action } = req.body; // 解构获取 action
            if (action) {
                const params = action.toString().split(" ");
                if (params.length > 0) {
                    const cmd = params[0].toLowerCase();
                    await postMessage({ msgType: params.shift(), opt: params }).then(
                    //await OnCommand(cmd as CommandType, sourceDir, destDir, options).then(
                    () => {
                        Logger.log("info", "%s done", cmd);
                    }
                    );
                }
                res.send({ message: `Action received: ${action}` });
            } else {
                res.status(400).send({ error: 'Action not provided!' });
            }
        });

        // 创建 HTTPS 服务器
        this.server = https.createServer({ key: privateKey, cert: certificate }, this.app);
        // 启动服务器
        this.server.listen(this.port, () => {
            Logger.log("debug",`Server is running at https://localhost:${this.port}`);
        });
    }
}

export { KttWebSrv };

