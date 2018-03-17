const Redis = require('ioredis');
const redisConfig = require('./../../../shared/redisConfig')
let redis = new Redis(redisConfig)
module.exports = redis;