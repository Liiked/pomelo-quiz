# pomelo-quiz
答题游戏
### 环境和依赖
```bash
基础配置：
redis
node
npm
cnpm
项目依赖：
npm install pomelo -g
```
### 启动
- 根据环境自行选择运行npm-install.bat或者npm-install.sh安装npm依赖
- game-server 目录：游戏服务器
    - 启动 pomelo start
    - 守护进程 pomelo deamon
    - 优雅关闭 pomelo stop
- web-server 目录：网页服务器
    - node app
### 查看服务器
[相关命令](https://github.com/NetEase/pomelo/wiki/pomelo命令行工具使用)
```bash
pomelo list
```