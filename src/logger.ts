import winston from "winston";
import * as path from "path";
import * as fs from "fs";

// Define your severity levels.
// With them, You can create log files,
// see or hide levels based on the running ENV.
const levels = {
  crit: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  silly: 5,
};

// This method set the current severity based on
// the current NODE_ENV: show all the log levels
// if the server was run in development mode; otherwise,
// if it was run in production, show only warn and error messages.
const showlevel = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "silly" : "warn";
};

// Define different colors for each level.
// Colors make the log message more visible,
// adding the ability to focus or ignore messages.
const colors = {
  crit: "red",
  error: "magenta",
  warn: "yellow",
  info: "white", // 'cyan',
  debug: "green",
  silly: "blue",
};

// Tell winston that you want to link the colors
// defined above to the severity levels.
winston.addColors(colors);
// winston.addColors(winston.config.syslog.colors);

// Chose the aspect of your log customizing the log format.
const format = winston.format.combine(
  // Add the message timestamp with the preferred format
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:SSS" }),
  // enables string interpolation
  winston.format.splat(),
  // winston.format.align(),
  // Define the format of the message showing the timestamp, the service, the level and the message
  winston.format.printf((info) => {
    const { timestamp, level, message, service, ...args } = info;
    return `${timestamp} [${service}] [${process.pid}] [${level}] :${message} ${
      Object.keys(args).length ? JSON.stringify(args) : ""
    }`;
  }),
  // Tell Winston that the logs must be colored
  winston.format.colorize({ all: true })
);

const LogConfig = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "logger.json"), "utf-8")
);

const Loggers = new Map<string, winston.Logger>();
export function Register(services: string[]) {
  // 访问不同传输的配置
  const loggerCfgs = services.map((serviceName) => {
    return LogConfig.services.find(
      (service: any) => service.name === serviceName
    );
  });

  loggerCfgs.forEach((config) => {
    //console.log(LogConfig.loger_home + config.port.all);
    Loggers.set(
      config.name,
      winston.createLogger({
        level: showlevel(),
        levels,
        // levels: winston.config.syslog.levels,
        defaultMeta: {
          service: config.name,
        },
        format,
        transports: [
          new winston.transports.Console(),
          new winston.transports.File({
            filename: LogConfig.loger_home + config.port.all,
          }),
          new winston.transports.File({
            filename: LogConfig.loger_home + config.port.error,
            level: "error",
          }),
        ],
      })
    );
  });
  return Loggers;
}
export function GetLogger(loggername: string) {
  return Loggers.get(loggername);
}
