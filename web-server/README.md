# 启动
```bash
node app.js
pm2 start app.js // 有条件时
```
# 构建和启动说明
- 在wechatConfig.js中配置微信公众号appID和secretID 
- index.html目录文件默认引用根目录下的index.js，而非/js下的文件，请务必注意替换版本号时的使用
- [特殊]目前express进程由nginx代理到子域名，而非3001端口号，因此前端请求在上线前，需要手动添加'/api'在所有axios的请求路径前
# 压力测试
- 使用benchmark.js进行测试