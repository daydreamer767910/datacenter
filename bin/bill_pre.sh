#!/bin/sh

# 获取当前日期，格式为月日 (MMdd)
var=$(date +%m%d)

# 设置源目录、目标目录和备份目录
src="$KTT_PATH/dailybill/"
send="${src}${var}/"
bak="${send}bak/"

# 输出日期
echo "Current date: $var"

# 创建目标目录（如果不存在）
if [ ! -d "$send" ]; then
    mkdir -p "$send"
fi

# 创建备份目录（如果不存在）
if [ ! -d "$bak" ]; then
    mkdir -p "$bak"
fi

# 移动 .xlsx 文件到备份目录
mv "${src}"*.xlsx "$bak"

# 输出操作结果
echo "The bills in $src are transferred to $bak!"
