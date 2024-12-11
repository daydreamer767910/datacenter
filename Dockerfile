FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 Node.js 项目文件并安装依赖
COPY package*.json ./

RUN npm install

# 复制 TypeScript 源代码和 bin 文件
COPY src ./src
COPY bin ./bin
RUN dos2unix ./bin/*.bat
COPY tsconfig.json ./
COPY .eslintrc.json ./
COPY .env ./

# 安装 MySQL 客户端
RUN apk --no-cache add mysql-client

# 构建 TypeScript 项目
RUN npm run rebuild

RUN apk add --no-cache tzdata


# 添加执行权限
RUN chmod +x dist/ktt.js


RUN npm install -g .

# 暴露服务端口
EXPOSE 7899

# 设置 CLI 入口
ENTRYPOINT ["ktt"]
CMD []
