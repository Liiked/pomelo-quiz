module.exports = function (app) {
	return new Handler(app);
};

var Handler = function (app) {
	this.app = app;
};

var handler = Handler.prototype;

/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
handler.enter = function (msg, session, next) {
	var rid = msg.rid;
	var uid = msg.openid + '*' + rid
	var sessionService = this.app.get('sessionService');
	var userInfo = {
		username: msg.username,
		openid: msg.openid,
		avatar: msg.avatar,
		sex: msg.sex,
	}

	//duplicate log in
	if (!!sessionService.getByUid(uid)) {
		next(null, {
			code: 500,
			error: true
		});
		return;
	}

	session.bind(uid);
	session.set('rid', rid);
	session.push('rid', function (err) {
		if (err) {
			console.error('set rid for session service failed! error is : %j', err.stack);
		}
	});
	// 用户退出
	session.on('closed', (app) => {
		if (!session || !session.uid) {
			return;
		}
		this.app.rpc.game.gameRemote.kick(session, session.uid, this.app.get('serverId'), session.get('rid'), null);
	});

	//用户加入频道
	this.app.rpc.game.gameRemote.add(session, uid, userInfo, this.app.get('serverId'), rid, true, function (users) {
		next(null, {
			users
		});
	});
};
