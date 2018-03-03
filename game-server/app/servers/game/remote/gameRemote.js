let gameMaster = require('./../../quiz/quiz');
const moment = require('moment');
let redis = require('./../../../database/index');

module.exports = function (app) {
	return new gameRemote(app);
};

var gameRemote = function (app) {
	this.app = app;
	this.channelService = app.get('channelService');
};

/**
 * Add user into chat channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 *
 */
gameRemote.prototype.add = function (uid, sid, name, flag, cb) {
	let channel = this.channelService.getChannel(name, flag);
	var username = uid.split('*')[0];

	if (!!channel) {
		channel.add(uid, sid);
	}

	// 初始化用户
	let user = {
		name: username,
		game_id: gameMaster.config.game_id, // 当前游戏id
		enter_timestamp: moment().unix(),
		exit_timestamp: '',
		exit_in_middle: false, // 中途退出
		win: false, // 胜利
		win_timestamp: '', // 胜利时间戳
		answers: []
	}

	redis.set(`u_${username}`, JSON.stringify(user));

	// 用户数变化 
	channel.pushMessage({
		route: 'playerAmountChange',
		user: username,
		total: channel.getUserAmount()
	});

	channel.pushMessage({
		route: 'gameState',
		state: gameMaster.gameState,
	});

	// 游戏状态变化
	gameMaster.stateCallback = (s) => {
		channel.pushMessage({
			route: 'gameState',
			state: s
		})
	}

	// 游戏倒计时
	gameMaster.countdownCallback = (t) => {
		channel.pushMessage({
			route: 'gameCountdown',
			time: t
		})
	}
	
	// 回合倒计时
	gameMaster.turnCountdownCallback = (t) => {
		channel.pushMessage({
			route: 'onTurn',
			time: t
		})
	}

	// 题目推送
	gameMaster.questionCallback = (q_id, o_id, question, options) => {
		channel.pushMessage({
			route: 'turnQuiz',
			q_id,
			o_id,
			question,
			options
		})
	}
	cb(this.get(name, flag));
};

/**
 * Get user from chat channel.
 *
 * @param {Object} opts parameters for request
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 * @return {Array} users uids in channel
 *
 */
gameRemote.prototype.get = function (name, flag) {
	var users = [];
	var channel = this.channelService.getChannel(name, flag);
	if (!!channel) {
		users = channel.getMembers();
	}
	for (var i = 0; i < users.length; i++) {
		users[i] = users[i].split('*')[0];
	}
	return users;
};

/**
 * Kick user out chat channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 *
 */
gameRemote.prototype.kick = function (uid, sid, name, cb) {
	var channel = this.channelService.getChannel(name, false);
	// leave channel
	if (!!channel) {
		channel.leave(uid, sid);
	}
	var username = uid.split('*')[0];
	

	redis.get(`u_${username}`).then(d => {
		let data = JSON.parse(d)
		data.exit_timestamp = moment().unix();
		data.exit_in_middle = true;
		redis.set(`u_${username}`, JSON.stringify(data));
	})


	let total = channel.getUserAmount()
	// 用户数变化 
	let param = {
		route: 'playerAmountChange',
		user: username,
		total
	};
	channel.pushMessage(param);


	cb();
};