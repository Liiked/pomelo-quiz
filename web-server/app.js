var express = require('express');
var app = express();
const axios = require('axios');
const wechatConfig = require('./wechatConfig');
const moment = require('moment')
// let user = require('./routes/user');

const Redis = require('ioredis');
let redis = new Redis({
    port: 6379, // Redis port
    host: '127.0.0.1', // Redis host
    family: 4, // 4 (IPv4) or 6 (IPv6)
    db: 0
})

app.configure(function () {
	app.use(express.methodOverride());
	app.use(express.bodyParser());
	// app.use(app.router);
	app.set('view engine', 'jade');
	app.set('views', __dirname + '/public');
	app.set('view options', {
		layout: false
	});
	app.set('basepath', __dirname + '/public');
});

app.configure('development', function () {
	app.use(express.static(__dirname + '/public'));
	app.use(express.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
	app.get('/getUerInfo/:code', function (req, res) {
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
				console.log(d.data);
				res.send(d.data);
			})
		})

	})
	app.get('/getGame', function (req, res) {
		
		redis.get('game').then(d=> {
			let data;
			try {
				data = JSON.parse(d)
			} catch (error) {
				res.send({
					start: -1,
					beforeStart: -1
				});
				return;
			}
			console.log(data);
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
					start:data.start_time,
					beforeStart: data.to_start || 5,
					reward: data.reward,
				});
			} else {
				res.send({
					start: -1,
					beforeStart: -1
				});
			}
		})

	})
});

app.configure('production', function () {
	var oneYear = 31557600000;
	app.use(express.static(__dirname + '/public', {
		maxAge: oneYear
	}));
	app.use(express.errorHandler());
});



console.log("Web server has started.\nPlease log on http://127.0.0.1:3001/index.html");
app.listen(80, '0.0.0.0');