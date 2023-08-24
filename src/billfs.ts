import * as path from "path";
import * as fs from "fs";

// 读取文件的逻辑拉出
function fsReadDir(dir: string) {
  return new Promise<string[]>((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) reject(err);
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
async function fileSearch(
  dirPath: string,
  filterFiles: string[],
  filterName?: string
) {
  const filter = new RegExp(`${filterName ? filterName : ""}\\S*.xlsx$`, "gi");
  //console.log(`search dir[${dirPath}]`)
  const files = await fsReadDir(dirPath);
  //console.log(`${files.length} files or dir found`)
  const promises = files.map((file) => {
    return fsStat(path.join(dirPath, file));
  });
  const datas = await Promise.all(promises).then(async (stats) => {
    for (let i = 0; i < files.length; i += 1) {
      files[i] = path.join(dirPath, files[i]);
      if (stats[i].isFile()) {
        if (files[i].match(filter)) {
          filterFiles.push(files[i]);
        }
      }
      if (stats[i].isDirectory()) {
        await fileSearch(files[i], filterFiles, filterName);
      }
    }
    return { stats, files };
  });
  //console.log("done");
  return datas;
}

export { fileSearch };
