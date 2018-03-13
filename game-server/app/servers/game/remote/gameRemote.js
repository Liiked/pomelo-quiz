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
gameRemote.prototype.add = function (uid, player, sid, name, flag, cb) {

	let channel = this.channelService.getChannel(name, flag);
	var openid = uid.split('*')[0];

	if (!!channel) {
		channel.add(uid, sid);
	}
	gameMaster.redis.get(`u_${openid}`).then(d => {
		let data = d[0]
		if (!data) {
			// 初始化用户
			let user = {
				name: player.username,
				openid: player.openid,
				sex: player.sex,
				avatar: player.avatar,
				enter_timestamp: moment().unix(),
				exit_timestamp: '',
				exit_in_middle: false, // 中途退出
				win: false, // 胜利
				win_timestamp: '', // 胜利时间戳
				answers: []
			}
			gameMaster.redis.set(`u_${openid}`, JSON.stringify(user));
		}
	})
	

	// 初始推送 
	channel.pushMessage({
		route: 'playerAmountChange',
		user: openid,
		remain: gameMaster.remainPlayer,
		total: gameMaster.playerAmount
	});

	channel.pushMessage({
		route: 'gameState',
		state: gameMaster.gameState,
		startAt: gameMaster.config.start_time
	});

	// 游戏状态变化
	gameMaster.stateCallback = (s) => {
		if ( s == 'playing') {
			let total = channel.getUserAmount()
			// 参与人数
			let resultInRedis = `gameResult:${gameMaster.config.id}`
			redis.get(resultInRedis).then(d=> {
				let data = JSON.parse(d);
				data.player_amount = total;
				data.remain_players = total;
				redis.set(resultInRedis,JSON.stringify(data));
			})
			gameMaster.playerAmount = total;
			gameMaster.remainPlayer = total;
		}
		channel.pushMessage({
			route: 'gameState',
			state: s,
			startAt: gameMaster.config.start_time
		})
	}

	// 玩家数变化
	gameMaster.playerAmountCallback = (s) => {
		channel.pushMessage({
			route: 'playerAmountChange',
			user: openid,
			remain: s,
			total: gameMaster.playerAmount
		});
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
	gameMaster.questionCallback = (q_id, order,total, question, options) => {
		channel.pushMessage({
			route: 'turnQuiz',
			q_id,
			order,
			total,
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
	var openid = uid.split('*')[0];

	
	if (gameMaster.gameState == 'playing') {
		gameMaster.redis.get(`u_${openid}`).then(d => {
			let data = JSON.parse(d)
			data.exit_timestamp = moment().unix();
			data.exit_in_middle = true;
			gameMaster.redis.set(`u_${openid}`, JSON.stringify(data));
		})
	
		// 参与人数
		// let total = channel.getUserAmount()
		let resultInRedis = `gameResult:${gameMaster.config.id}`
		redis.get(resultInRedis).then(d=> {
			let data = JSON.parse(d);
			data.remain_players --;
			redis.set(resultInRedis,JSON.stringify(data));
			// 用户数变化 
			let param = {
				route: 'playerAmountChange',
				user: openid,
				remain: data.remain_players,
				total: gameMaster.playerAmount
			};
			channel.pushMessage(param);
		})
	}
	cb();
};