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
npm install pm2 -g
```
### 配置文件
- 在`/shared`目录下，参考`*.exmaple.js`分别配置`wechatConfig.js`和`redisConfig.js`，两者缺一不可。
- pomelo 服务器配置：进入game-server目录，修改或覆盖`servers.json`，其中`host`对应的值必须为正式服务器的**外部可访问ip地址**，不可为域名
### 启动
- 根据环境自行选择运行`npm-install.bat`或者`npm-install.sh`安装npm依赖。详情参考[安装pomelo](https://github.com/NetEase/pomelo/wiki/安装pomelo)
- game-server 目录：游戏服务器
    - 启动 `pomelo start`
    - 生产模式 `pomelo start -e`
    - 守护进程 `pomelo start -D`
    - 优雅关闭 `pomelo stop`
- web-server 目录：网页服务器
    - 启动`npm start` 或 `pm2 start /bin/www`
    - 关闭`pm2 delete www` 或 `pm2 delete all`
### 查看服务器
[相关命令](https://github.com/NetEase/pomelo/wiki/pomelo命令行工具使用)
```bash
pomelo list
查看pomelo日志-> /logs 目录
```