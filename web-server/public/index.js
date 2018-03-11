'use strict';

var bus = new Vue();

var quiz = {
    key: 'quiz',
    template: '#quiz',
    data: function data() {
        return {
            // 题目
            quizTitle: '巴拉巴拉哈哈哈哈航啊', //题目标题
            quizMsg: '',
            quizID: 0, // 题目id
            options: [], // 选项
            turnIndex: 0, // 当前回合数
            turnTotal: 0, // 回合总数
            turnCountdown: 0, // 回合倒计时

            // 游戏人数
            playerAmount: 0, // 玩家总数
            remainders: 0, //剩余人数

            // 
            picked: 0,
            // 游戏状态
            start: 'stop',
            tappable: true,
            right: -1,
            rightAnswer: -1,
            gameOver: false,
            lose: false,
            kickoutMsg: '您已答错过题目，不可以继续作答了哦',
            win: false
        };
    },
    mounted: function mounted() {
        var _this = this;

        // 收发器

        bus.$on('game-state-coming', function (d) {
            _this.start = d;
        });

        bus.$on('remainders', function (d) {
            _this.remainders = d.remainders;
            _this.playerAmount = d.playerAmount;
        });

        bus.$on('quiz-coming', function (d) {
            if (_this.turnIndex > 0 && !_this.picked && !_this.lose) {
                _this.lose = true;
                _this.kickoutMsg = '您已经放弃答题，请在下一轮游戏中再接再厉';
                _this.emptyAnswer(_this.quizID, _this.turnIndex, 0);
            }
            _this.initQuestion();
            console.log(d);
            _this.turnIndex = d.turnIndex;
            _this.turnTotal = d.turnTotal;
            _this.quizTitle = d.quizTitle;
            _this.options = d.options;
            _this.quizID = d.quizID;
        });

        bus.$on('turn-countdown', function (d) {
            _this.turnCountdown = d.time;
            _this.remainders = d.remainders;
            _this.playerAmount = d.playerAmount;
        });
    },

    methods: {
        pushNext: function pushNext() {
            this.$emit('push-page', {
                extends: result,
                onsNavigatorProps: {
                    win: this.win,
                    remainders: this.remainders,
                    playerAmount: this.playerAmount
                }
            });
        },
        pickChange: function pickChange(e) {
            if (!this.tappable) {
                e.preventDefault();
                return;
            }
        },

        // 答题、获取游戏结果
        answer: function answer(id) {
            var _this2 = this;

            pomelo.request("game.gameHandler.send", {
                rid: 'quiz',
                quiz_id: this.quizID,
                order_id: this.turnIndex,
                answer: id
            }, function (data) {
                // console.log(data);
                if (data.error) {
                    _this2.$ons.notification.toast('服务器出错了，抱歉', {
                        timeout: 2000
                    });
                    return;
                }
                _this2.right = data.result;
                if (!data.result) {
                    _this2.tappable = false;
                    _this2.lose = true;
                    _this2.rightAnswer = data.answer;
                }
                if (data.win) {
                    _this2.win = true;
                }
            });
        },
        emptyAnswer: function emptyAnswer(quizID, turnIndex, id) {
            pomelo.request("game.gameHandler.send", {
                rid: 'quiz',
                quiz_id: quizID,
                order_id: turnIndex,
                answer: id
            }, function (data) {
                console.log('empty answer');
            });
        },
        initQuestion: function initQuestion() {
            console.log('ex-----------');
            if (this.lose) {
                this.tappable = false;
            } else {
                this.tappable = true;
            }
            this.right = -1;
            this.rightAnswer = -1;
            this.picked = 0;
        }
    },
    watch: {
        start: function start(v) {
            if (v == 'stop') {
                this.pushNext();
            }
        },
        picked: function picked(latest, old) {
            if (!latest) {
                return;
            }
            this.tappable = false;
            this.answer(latest);
        }
    }
};

var welcome = {
    key: 'welcome',
    template: '#welcome',
    data: function data() {
        return {
            // 用户信息
            logined: false,
            userName: '',
            openid: '',
            gender: '',
            headimgurl: '',
            loginError: '',
            // 比赛数据
            start: 'stop', // 游戏是否开始
            countdown: 0,
            gameStartAt: '' // 游戏开始时间
        };
    },
    mounted: function mounted() {
        var _this3 = this;

        bus.$on('user-coming', function (d) {
            _this3.logined = d.logined;
            _this3.userName = d.userName;
            _this3.openid = d.openid;
            _this3.gender = d.gender;
            _this3.headimgurl = d.headimgurl;
        });

        bus.$on('error-coming', function (d) {
            _this3.loginError = d;
        });

        // 倒计时和游戏开始
        bus.$on('countdown-coming', function (d) {
            _this3.countdown = d.countdown;
            _this3.gameStartAt = d.startAt;
        });
        bus.$on('game-state-coming', function (d) {
            _this3.start = d;
        });
    },

    computed: {
        gameState: function gameState() {
            var a = {
                start: '游戏即将开始',
                playing: '游戏正在进行',
                end: '游戏结束',
                stop: '游戏尚未就绪'
            };
            return a[this.start];
        },
        startAt: function startAt() {
            if (!this.gameStartAt) {
                return '';
            }
            return moment.unix(this.gameStartAt).format('YYYY年MM月DD日 HH:mm:ss');
        }
    },
    watch: {
        start: function start(v) {
            if (v == 'playing' && this.countdown == 1) {
                this.$emit('push-page', quiz);
            }
        }
    }
};

var result = {
    key: 'result',
    template: '#result',
    props: ['win', 'playerAmount', 'remainders'],
    data: function data() {
        return {};
    },
    mounted: function mounted() {
        console.log('mountd');
    }
};

var app = new Vue({
    el: '#app',
    template: '#main',
    data: function data() {
        return {
            // 页面
            pageStack: [welcome],

            // 用户信息
            logined: false,
            userName: '',
            openid: '',
            gender: '',
            headimgurl: '',

            // 用户数
            playerAmount: 0,
            remainders: 0,

            // 倒计时
            countdown: 0,
            startAt: '',

            errorMsg: '',

            // 玩家状态
            lose: false,
            win: false,

            // 比赛数据
            start: 'stop', // 游戏是否开始
            // 轮次数据
            question: '',
            q_id: null,
            order: 0,
            totalQuiz: 0,
            options: [],
            turnCountdown: 0
        };
    },
    mounted: function mounted() {
        var _this4 = this;

        this.wechatLogin();

        // 用户断开连接
        pomelo.on('disconnect', function (reason) {
            _this4.logined = false;
            console.error(reason);
        });

        // 用户数推送
        pomelo.on('playerAmountChange', function (d) {
            _this4.playerAmount = d.total;
            _this4.remainders = d.remain;
            console.group('playerAmountChange');
            console.log(d);
            console.groupEnd('playerAmountChange');
        });
        // 游戏进行状态
        pomelo.on('gameState', function (d) {
            _this4.start = d.state || 'stop';
            _this4.startAt = d.startAt;
            if (_this4.start == 'stop' || _this4.start == 'end') {
                _this4.question = '';
            }
            console.group('game-state');
            console.log(d);
            console.groupEnd('game-state');

            if (d.state == 'start') {
                _this4.$emit('push-page', quiz);
            }
        });
        // 比赛倒计时推送
        pomelo.on('gameCountdown', function (d) {
            _this4.countdown = d.time;
            console.group('countdown');
            console.log(d);
            console.groupEnd('countdown');
        });
        // 回合倒计时推送
        pomelo.on('onTurn', function (d) {
            _this4.turnCountdown = d.time;
        });
        // 题目推送
        pomelo.on('turnQuiz', function (d) {
            _this4.question = d.question;
            _this4.options = d.options;
            _this4.q_id = d.q_id;
            _this4.totalQuiz = d.total;
            _this4.order = d.order;
            _this4.picked = null;
            console.group('turnQuiz');
            console.log(d);
            console.groupEnd('turnQuiz');
            if (!_this4.lose) {
                _this4.cantEdit = false;
            }
        });
    },

    watch: {
        logined: function logined(latest, old) {
            if (latest) {
                var data = {
                    userName: this.userName,
                    openid: this.openid,
                    gender: this.gender,
                    headimgurl: this.headimgurl,
                    logined: latest
                };
                bus.$emit('user-coming', data);
            }
        },
        errorMsg: function errorMsg(latest, old) {
            bus.$emit('error-coming', latest);
        },
        countdown: function countdown(latest) {
            var data = {
                countdown: latest,
                startAt: this.startAt
                // 进入游戏
            };if (latest == 1) {
                this.$emit('push-page', quiz);

                bus.$emit('remainders', {
                    remainders: this.remainders,
                    playerAmount: this.playerAmount
                });
            }
            bus.$emit('countdown-coming', data);
        },
        start: function start(latest) {
            bus.$emit('game-state-coming', latest);
        },

        // 回合
        turnCountdown: function turnCountdown(v) {
            bus.$emit('turn-countdown', {
                time: v,
                remainders: this.remainders,
                playerAmount: this.playerAmount
            });
        },
        order: function order(v) {
            bus.$emit('quiz-coming', {
                turnIndex: v,
                turnTotal: this.totalQuiz,
                quizTitle: this.question,
                options: this.options,
                quizID: this.q_id
            });
        },
        remain: function remain(v) {
            bus.$emit('remainders', {
                remainders: v,
                playerAmount: this.playerAmount
            });
        }
    },
    methods: {
        wechatLogin: function wechatLogin() {
            var _this5 = this;

            var param = GetRequest();

            if (!param.code) {
                var url = encodeURIComponent('http://' + location.host + '/');
                location.href = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + 'wxc0aa02ca51509241' + '&redirect_uri=' + url + '&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect';
            } else {
                axios.get('/getUerInfo/' + param.code).then(function (d) {
                    var data = d.data;

                    if (data.errcode == 40001) {
                        location.href = '//' + location.host;
                    }

                    _this5.userName = data.nickname;
                    _this5.headimgurl = data.headimgurl;
                    _this5.openid = data.openid;
                    _this5.gender = data.sex;
                    _this5.dispatchServer();
                    console.log(d.data);
                }).catch(function (e) {
                    alert('出错');
                });
            }
        },

        // 获取服务器
        dispatchServer: function dispatchServer() {
            var _this6 = this;

            pomelo.init({
                host: window.location.hostname,
                port: 3014,
                log: true
            }, function () {
                pomelo.request('gate.gateHandler.queryEntry', {
                    uid: _this6.openid
                }, function (data) {
                    // 关闭入口
                    console.log(data);
                    pomelo.disconnect();
                    if (data.code == 500) {
                        console.log('login failed');
                        if (data.msg) {
                            _this6.errorMsg = data.msg;
                        }
                        return;
                    }
                    _this6.enter(data.host, data.port);
                });
            });
        },

        // 进入游戏
        enter: function enter(host, port) {
            var _this7 = this;

            pomelo.init({
                host: host,
                port: port,
                log: true
            }, function () {
                pomelo.request("connector.entryHandler.enter", {
                    username: _this7.userName,
                    openid: _this7.openid,
                    avatar: _this7.headimgurl,
                    sex: _this7.gender,
                    rid: 'quiz'
                }, function (data) {
                    console.log(data);
                    if (data.err) {
                        alert(data.err);
                        return;
                    }
                    _this7.logined = true;
                });
            });
        }
    }
});

function GetRequest() {

    var url = location.search; //获取url中"?"符后的字串
    var theRequest = new Object();
    if (url.indexOf("?") != -1) {
        var str = url.substr(1);
        var strs = str.split("&");
        for (var i = 0; i < strs.length; i++) {
            theRequest[strs[i].split("=")[0]] = strs[i].split("=")[1];
        }
    }
    return theRequest;
}