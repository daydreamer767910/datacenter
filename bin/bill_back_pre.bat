#!/bin/sh

# 设置日期变量为mmdd格式
var=$(date +%m%d)

# 设置源目录和目标目录路径
src="/app/express/"
send="${src}${var}/"
bak="/app/dailybill/${var}/bak/"

# 输出当前日期和目录信息
echo "Current date: $var"

# 如果目标目录不存在，则创建
if [ ! -d "$send" ]; then
    echo "Creating directory $send..."
    mkdir -p "$send"
fi

# 如果源目录有文件，则移动文件到目标目录
if [ "$(ls -A $src 2>/dev/null)" ]; then
    echo "Moving files from $src to $send..."
    mv "$src"* "$send"
    echo "The expresses are transferred to $send!"
fi

# 如果备份根目录不存在，则创建
if [ ! -d "$(dirname $bak)" ]; then
    echo "Creating directory $(dirname $bak)..."
    mkdir -p "$(dirname $bak)"
fi

# 如果备份目录不存在，则创建
if [ ! -d "$bak" ]; then
    echo "Creating directory $bak..."
    mkdir -p "$bak"
fi
