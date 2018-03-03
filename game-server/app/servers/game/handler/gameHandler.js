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
	var rid = session.get('rid');
	var username = session.uid.split('*')[0];
	var channelService = this.app.get('channelService');
	var res = {
		quiz_id: msg.quiz_id,
		answer: msg.answer,
		timestamp: moment().unix(),
		result: 0
	};

	let config = gameMaster.config

	if (!config || Object.keys(config).length < 1) {
		next(null, {
			route: msg.route,
			msg: '请求出错'
		});
		return
	}

	let len = config.quiz.length
	let answer = gameMaster.gameQuestions.answer
	
	redis.get(`u_${username}`).then(d => {
		let data = JSON.parse(d);
		
		if (msg.answer == answer) {
			res.result = 1;
			console.log('length is -------------------------');
			console.log(msg.order_id, len);
			if (msg.order_id == len) {
				data.win = true
				data.win_timestamp = res.timestamp
			}
		}

		data.answers.push(res);
		redis.set(`u_${username}`, JSON.stringify(data))
		console.log(res);
		next(null, {
			route: msg.route,
			answer: Boolean(res.result),
			win: data.win
		});

	})

	console.log(msg);
};