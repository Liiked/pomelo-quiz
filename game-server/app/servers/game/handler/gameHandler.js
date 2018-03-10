let gameRemote = require('../remote/gameRemote');
let moment = require('moment');
let redis = require('./../../../database/index');
let gameMaster = require('./../../quiz/quiz')

module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

var handler = Handler.prototype;

/**
 * Send messages to users
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
handler.send = function(msg, session, next) {
	console.log('come into send');
	var channelService = this.app.get('channelService');
	var rid = session.get('rid');
	var openid = session.uid.split('*')[0];
	let config = gameMaster.config;
	// 配置和答案
	if (!config || Object.keys(config).length < 1) {
		next(null, {
			route: msg.route,
			msg: '请求出错'
		});
		return
	}
	let rightAnswer = gameMaster.gameQuestions.answer
	var res = {
		quiz_id: msg.quiz_id,
		playerAnswer: msg.answer,
		answer: rightAnswer,
		timestamp: moment().unix(),
		result: 0 // 1胜利，0错误
	};

	let len = config.quiz.length

	// 数据库处理
	gameMaster.redis.get(`u_${openid}`).then(d => {
		let data = JSON.parse(d);
		
		if (res.playerAnswer == rightAnswer) {
			res.result = 1;
			console.log('length is -------------------------');
			console.log(msg.order_id, len);
			if (msg.order_id == len) {
				data.win = true
				data.win_timestamp = res.timestamp
			}
		} else {
			-- gameMaster.remainPlayer
		}

		data.answers.push(res);
		gameMaster.redis.set(`u_${openid}`, JSON.stringify(data))

		next(null, {
			route: msg.route,
			yourAnswer: res.playerAnswer, // 用户答案 
			answer: res.answer, // 正确答案
			win: data.win,
			result: res.result // 结果
		});

	})

	console.log(msg);
};