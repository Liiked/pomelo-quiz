var dispatcher = require('../../../util/dispatcher');
let gameMaster = require('./../../quiz/quiz')

module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

var handler = Handler.prototype;

/**
 * Gate handler that dispatch user to connectors.
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param {Function} next next stemp callback
 *
 */
handler.queryEntry = function(msg, session, next) {
	var uid = msg.uid;
	if(!uid) {
		next(null, {
			code: 500
		});
		return;
	}
	console.log('gate state is',gameMaster.gameState);

	if (gameMaster.gameState == 'playing') {
		next(null, {
			code: 500,
			msg: '游戏正在进行，请下次抓紧时间入场'
		});
		return;
	}


	// get all connectors
	var connectors = this.app.getServersByType('connector');
	if(!connectors || connectors.length === 0) {
		next(null, {
			code: 500
		});
		return;
	}
	// select connector
	var res = dispatcher.dispatch(uid, connectors);
	console.log('res is ');
	console.log(res);
	next(null, {
		code: 200,
		host: res.host,
		port: res.clientPort
	});
};
