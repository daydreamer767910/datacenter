# 编译器和编译选项
CC = gcc
CFLAGS = -shared

# 目标文件
TARGET = mylib.dll

# 源文件列表
SRCS = mylib.c

# 生成的目标
all: $(TARGET)

$(TARGET): $(SRCS)
	$(CC) $(CFLAGS) -o $@ $^
# 清理中间文件和可执行文件
clean:
	rm -f $(TARGET) *.o
