# 启动
```bash
pomelo start
```
# redis配置
- 配置参考config下的sample.json，取redis的game文档
# 配置说明
- 配置微信公众号appID和secretID wechatConfig.js
- 使用生产环境命令pomelo start -e，该模式启动的游戏日志不再输出到控制台，请手动查看日志文件
- 使用守护模式pomelo start -D
- 启动前先检查config/servers.json中的host是否与服务器的ip/域名地址一致，不然可能导致无法访问