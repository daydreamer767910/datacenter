import express, { Request, Response, Express } from 'express';
import { postMessage } from "./app";
import * as LOG from "./logger";

const Logger = {
  log: (level: string, message: string, ...meta: any[]) =>
    LOG.GetLogger("comm")?.log(level, message, ...meta),
};

class KttWebSrv {
    private app: Express;
    private port: number;

    constructor(port: number) {
        this.app = express();
        this.port = port;
    }

    public initialize(): void {
        // 中间件：解析 JSON 请求体
        this.app.use(express.json());

        // GET 路由
        this.app.get('/', (req: Request, res: Response) => {
            let rspstr = `use the following commands to:
                1.distribute daily billing:\r\n
                    curl -X POST http://localhost:8080/api -H "Content-Type: application/json" -d "{\\"action\\": \\"paidan\\"}" \r\n
                2.update the coming back billing:\r\n
                    curl -X POST http://localhost:8080/api -H "Content-Type: application/json" -d "{\\"action\\": \\"huidan\\"}"`
            res.setHeader('Content-Type', 'text/plain');    
            res.send(`<pre>\r\n${rspstr}\r\n</pre>`);
        });

        // POST 路由
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

        // 启动服务器
        this.app.listen(this.port, () => {
            Logger.log("debug",`Server is running at http://localhost:${this.port}`);
        });
    }
}

export { KttWebSrv };

