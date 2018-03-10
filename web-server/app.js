var express = require('express');
var app = express();
const axios = require('axios');
// let user = require('./routes/user');

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
	app.get('/api/getUerInfo/:code', function (req, res) {
		let param = req.params;
		console.log(req.params);
		axios.get('https://api.weixin.qq.com/sns/oauth2/access_token?appid=' +
			'wxc0aa02ca51509241' +
			'&secret=' +
			'2ff4f56598234553fc2a0a08c276b3eb' +
			'&code=' +
			param.code +
			'&grant_type=authorization_code').then(d => {
				console.log(d.data);
			let [openID, token] = [d.data.openid, d.data.access_token]
			
			axios.get(`https://api.weixin.qq.com/sns/userinfo?access_token=${token}&openid=${openID}&lang=zh_CN`).then(d => {
				console.log(d.data);
				res.send(d.data);
			})
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