import * as net from "net";
//import * as path from "path";
import { App } from "./app";
import * as LOG from "./logger";

const Logger = {
  log: (level: string, message: string, ...meta: any[]) =>
    LOG.GetLogger("comm")?.log(level, message, ...meta),
};

class CommSrv {
  private server: net.Server;
  public initialize(port = 7899) {
    this.server = net.createServer((socket) => {
      Logger.log("info", "Client connected");
      // 当收到客户端数据时的处理
      socket.on("data", async (data) => {
        // 发送响应给客户端
        await this.onRecv(data);
        socket.write("done");
      });
      socket.on("error", (err) => {
        Logger.log("error", "%s", err);
      });
      // 客户端断开连接时的处理
      socket.on("end", () => {
        Logger.log("debug", "Client disconnected");
      });
    });
    this.server.listen(port, () => {
      Logger.log("debug", "Server listening on port[%s]", port);
    });
  }
  private async onRecv(data: Buffer) {
    Logger.log("debug", `Received data from client: ${data}`);
    const params = data.toString().split(" ");

    if (params.length > 0) {
      const cmd = params[0].toLowerCase();
      await App.postMessage({ cmd: params.shift(), opt: params }).then(
        //await OnCommand(cmd as CommandType, sourceDir, destDir, options).then(
        () => {
          Logger.log("info", "%s done", cmd);
        }
      );
    }
  }
}

export const Commsrv = new CommSrv();
