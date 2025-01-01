# Stage 1: Build C++ Library
FROM ubuntu:22.04 AS cpp_builder

# 安装 C++ 编译工具和 CMake
RUN apt-get update && apt-get install -y \
    build-essential cmake libuv1-dev nlohmann-json3-dev pkg-config && \
    rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app/lib

# 复制 C++ 源代码
COPY lib/src /app/lib/src

# 构建 C++ 库
RUN mkdir -p build && cd build && \
    cmake ../src && make && make install


# Stage 2: Build Node.js Application
FROM node:16-buster AS node_builder

# 安装必要的开发依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    python3-pip \
    libffi-dev \
    libssl-dev \
#    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制并安装 Node.js 项目依赖
COPY package*.json ./ 
RUN npm install

# 复制 TypeScript 源代码和其他配置文件
COPY src ./src
COPY bin ./bin
#RUN dos2unix ./bin/*.sh
COPY tsconfig.json ./
COPY .eslintrc.json ./
COPY .env ./

# 构建 TypeScript 项目
RUN npm run rebuild

# 添加执行权限
RUN chmod +x dist/ktt.js
RUN chmod +x dist/cli.js
# Stage 3: Runtime Environment
FROM node:18-slim AS runtime

# 安装运行时依赖（如 MySQL 客户端等）
#RUN apk --no-cache add mysql-client
#RUN apk add --no-cache tzdata
RUN apt-get update && apt-get install -y \
	default-mysql-client \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制应用和 C++ 库
# 从 C++ 构建阶段复制编译后的库
COPY --from=cpp_builder /app/lib/build/lib ./lib
COPY --from=node_builder /app/bin ./bin
COPY --from=node_builder /app/dist ./dist
COPY --from=node_builder /app/node_modules ./node_modules
COPY package*.json ./
COPY .env ./

# 安装全局依赖
RUN npm install -g .

# 暴露服务端口
EXPOSE 7899

# 设置 CLI 入口
ENTRYPOINT ["ktt"]
CMD []
