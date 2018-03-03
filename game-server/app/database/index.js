const Redis = require('ioredis');
let reids = new Redis({
    port: 6379, // Redis port
    host: '127.0.0.1', // Redis host
    family: 4, // 4 (IPv4) or 6 (IPv6)
    db: 0
})

module.exports = reids;