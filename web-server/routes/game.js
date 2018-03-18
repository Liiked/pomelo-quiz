var express = require('express');
var router = express.Router();
const axios = require('axios');
const wechatConfig = require('../../shared/wechatConfig');
const moment = require('moment');
const redisConfig = require('../../shared/redisConfig')

const Redis = require('ioredis');
let redis = new Redis(redisConfig)

// 接口-获取用户信息
router.get('/getUerInfo/:code', function (req, res) {
    let param = req.params;
    axios.get('https://api.weixin.qq.com/sns/oauth2/access_token?appid=' +
        wechatConfig.appID +
        '&secret=' +
        wechatConfig.secret +
        '&code=' +
        param.code +
        '&grant_type=authorization_code').then(d => {
        let [openID, token] = [d.data.openid, d.data.access_token]

        axios.get(`https://api.weixin.qq.com/sns/userinfo?access_token=${token}&openid=${openID}&lang=zh_CN`).then(d => {
            res.send(d.data);
        })
    })
})
// 获取游戏信息
router.get('/getGame', function (req, res) {

    redis.get('game').then(d => {
        let data;
        if (!d || d.length < 1) {
            res.send({
                start: -1,
                beforeStart: -1
            });
            return;
        }
        try {
            data = JSON.parse(d)
        } catch (error) {
            res.send({
                start: -1,
                beforeStart: -1
            });
            return;
        }

        if (!data.start_time) {
            res.send({
                start: -1,
                beforeStart: -1
            });
            return;
        }

        let diff = Number(moment.unix(data.start_time).diff(moment()) / 1000).toFixed(0);
        if (diff > 0) {
            res.send({
                start: data.start_time,
                beforeStart: data.to_start || 5,
                reward: data.reward,
                game_id: data.id
            });
        } else {
            res.send({
                start: -1,
                beforeStart: -1
            });
        }
    })

})
// 获取游戏结果
router.get('/getResult/:id', function (req, res) {
    let gameID = req.params.id;

    redis.get('gameResult:' + gameID).then(d => {
        let data;
        try {
            data = JSON.parse(d)
            let winners = data.winners.slice(0, 15)
            res.send(winners);
        } catch (error) {
            console.error(error);
            res.send({
                msg: '游戏结果请求出错'
            });
            return;
        }

    })

})

module.exports = router;