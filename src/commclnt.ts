import net from "net";
import * as LOG from "./logger";

const Logger = {
  log: (level: string, message: string, ...meta: any[]) =>
    LOG.GetLogger("comm")?.log(level, message, ...meta),
};

class CommClnt {
  // 创建一个 TCP 连接到指定的服务器和端口
  private client: net.Socket;
  public connect(ip: string, srvport: number) {
    this.client = net.createConnection({ host: ip, port: srvport }, () => {
      Logger.log("info", "connected to %s:%d", ip, srvport);
      // 当连接建立后，可以向服务器发送数据
      //this.client.write("Hello, server!");
    });
    // 监听从服务器接收到的数据
    this.client.on("data", (data) => {
      Logger.log("debug", "recv from server:", data);
    });

    // 监听连接关闭事件
    this.client.on("end", () => {
      Logger.log("debug", "connection is closed");
    });

    // 监听连接错误事件
    this.client.on("error", (err) => {
      Logger.log("error", "connection err:", err);
    });
  }
  public sendCmd(data: string) {
    this.client.write(data);
  }
  public disconnect() {
    // 当需要关闭连接时，可以调用 client.end()
    this.client.end();
  }
}

const comm_clnt_command = (cmds: string[]) => {
  Logger.log("debug", `send[${cmds.filter((v) => v !== "send")}]`);
  const commclnt = new CommClnt();
  commclnt.connect("127.0.0.1", 7899);
  commclnt.sendCmd(cmds.filter((v) => v !== "send").join(" "));
  commclnt.disconnect();
};
export { CommClnt, comm_clnt_command };
