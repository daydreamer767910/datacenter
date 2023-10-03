import * as path from "path";
import * as fs from "fs";

export const billconfig = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "billconfig.json"), "utf-8")
);
export const dailybill = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "dailybill.json"), "utf-8")
);
export const dailybill_A = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "dailybill_A.json"), "utf-8")
);
export const dailybill_F = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "dailybill_F.json"), "utf-8")
);
export const dailybill_H = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "dailybill_H.json"), "utf-8")
);
export const dailybill_back = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "dailybill_back.json"), "utf-8")
);
export const client_json = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "client.json"), "utf-8")
);

export interface FileInfo {
  path: string;
  size: number;
  createdAt: Date;
  mode: number;
}

// 读取文件的逻辑拉出
function fsReadDir(dir: string) {
  return new Promise<string[]>((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) reject(err);
      //resolve(files.map((file) => path.join(dir, file)));
      resolve(files);
    });
  });
}
// 获取fs.stats的逻辑拉出
function fsStat(path: string) {
  return new Promise<fs.Stats>((resolve, reject) => {
    fs.stat(path, (err, stat) => {
      if (err) reject(err);
      resolve(stat);
    });
  });
}

// 搜索文件主方法
async function fileSearchExt(
  dirPath: string,
  searchSubDir = true,
  filterName?: string
) {
  const pattern = filterName
    ? filterName + "\\S*.xlsx$|\\S*.csv$"
    : "\\S*.xlsx$|\\S*.csv$";
  const filter = new RegExp(pattern, "gi");
  //console.log(`search dir[${dirPath}]`)
  let files = await fsReadDir(dirPath);
  files = files.map((file) => path.join(dirPath, file));

  const promises = files.map((file) => {
    return fsStat(file);
  });
  const realfiles: FileInfo[] = [];
  const dirs: FileInfo[] = [];
  await Promise.all(promises).then((stats) => {
    for (let i = 0; i < files.length; i += 1) {
      if (stats[i].isFile()) {
        if (files[i].match(filter)) {
          realfiles.push({
            path: files[i],
            size: stats[i].size, // 文件大小（字节）
            createdAt: stats[i].ctime, // 创建时间
            mode: stats[i].mode,
            // 还可以添加其他文件信息，如状态等
          });
        }
      }
      if (stats[i].isDirectory() && searchSubDir) {
        dirs.push({
          path: files[i],
          size: stats[i].size, // 文件大小（字节）
          createdAt: stats[i].ctime, // 创建时间
          mode: stats[i].mode,
          // 还可以添加其他文件信息，如状态等
        });
      }
    }
  });

  for (let i = 0; i < dirs.length; i += 1) {
    const subFiles = await fileSearchExt(
      dirs[i].path,
      searchSubDir,
      filterName
    );
    realfiles.push(...subFiles);
  }
  return realfiles;
}

async function fileSearch(
  dirPath: string,
  searchSubDir = true,
  filterName?: string
) {
  const pattern = filterName
    ? filterName + "\\S*.xlsx$|\\S*.csv$"
    : "\\S*.xlsx$|\\S*.csv$";
  const filter = new RegExp(pattern, "gi");
  // 读取目录下的所有文件和子目录
  try {
    const filesAndDirs = await fsReadDir(dirPath);

    // 存储结果的数组
    const result: FileInfo[] = [];

    // 遍历所有文件和子目录
    for (const item of filesAndDirs) {
      const itemPath = path.join(dirPath, item);
      const stats = await fsStat(itemPath);
      if (stats.isFile() && itemPath.match(filter)) {
        // 如果是文件，将文件信息添加到结果中
        //console.log(`${itemPath} is file matched [${pattern}]`);
        result.push({
          path: itemPath,
          size: stats.size, // 文件大小（字节）
          createdAt: stats.ctime, // 创建时间
          mode: stats.mode,
          // 还可以添加其他文件信息，如状态等
        });
      } else if (stats.isDirectory() && searchSubDir) {
        // 如果是目录，递归调用函数以获取目录内文件信息
        const subFiles = await fileSearch(itemPath, searchSubDir, filterName);
        result.push(...subFiles);
      }
    }
    return result;
  } catch (err) {
    console.log(err);
  }
}
export { fileSearchExt, fileSearch };
