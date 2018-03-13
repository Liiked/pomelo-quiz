'use strict';

var bus = new Vue();

var quiz = {
    key: 'quiz',
    template: '#quiz',
    props: ['reward'],
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
            tappable: 1,
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
            if (!_this.right) {
                _this.lose = true;
            }
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
                    playerAmount: this.playerAmount,
                    reward: this.reward
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
                console.log(data);
                if (data.error) {
                    _this2.$ons.notification.toast('服务器出错了，抱歉', {
                        timeout: 2000
                    });
                    return;
                }
                if (data.win) {
                    _this2.win = true;
                }
                _this2.right = data.result;
                _this2.rightAnswer = data.answer;
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
                this.tappable = 0;
            } else {
                this.tappable = 1;
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
            this.tappable = 0;
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
            gameStartAt: '', // 游戏开始时间
            // express服务器数据
            showGameInfo: false,
            willStartAt: '',
            beforeStart: '',
            reward: 0,
            readyID: null
        };
    },
    mounted: function mounted() {
        var _this3 = this;

        this.getGameInfo();

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
        },
        willStart: function willStart() {
            if (!this.willStartAt) {
                return '';
            }
            return moment.unix(this.willStartAt).format('YYYY年MM月DD日 HH:mm:ss');
        }
    },
    methods: {
        getGameInfo: function getGameInfo() {
            var _this4 = this;

            axios.get('/getGame').then(function (d) {
                var data = d.data;
                if (data.start != -1) {
                    _this4.willStartAt = data.start;
                    _this4.beforeStart = data.beforeStart;
                    _this4.reward = data.reward;
                    if (!_this4.gameStartAt) {
                        _this4.showGameInfo = true;
                        _this4.readyToGo();
                    }
                }

                console.log(d);
            }).catch(function (e) {
                alert('express 服务出错');
            });
        },
        readyToGo: function readyToGo() {
            var _this5 = this;

            this.readyID = setInterval(function (_) {
                var nowToStart = Number(moment.unix(_this5.willStartAt).diff(moment()) / 1000).toFixed(0);
                var diff = Number(nowToStart) - 60 * Number(_this5.beforeStart);
                if (diff < 0) {
                    clearInterval(_this5.readyID);
                    location.reload();
                }
            }, 15000);
        }
    },
    watch: {
        start: function start(v) {
            if (v == 'playing' && this.countdown == 1) {
                this.$emit('push-page', {
                    extends: quiz,
                    onsNavigatorProps: {
                        reward: this.reward
                    }
                });
            }
        },
        gameStartAt: function gameStartAt(v) {
            if (v) {
                this.showGameInfo = false;
                clearTimeout(this.readyID);
            }
        }
    }
};

var result = {
    key: 'result',
    template: '#result',
    props: ['win', 'playerAmount', 'remainders', 'reward'],
    mounted: function mounted() {
        console.log('mountd');
    },

    computed: {
        eachReward: function eachReward() {
            return (Number(this.reward) / Number(this.remainders)).toFixed(0);
        }
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
        var _this6 = this;

        this.wechatLogin();

        // 用户断开连接
        pomelo.on('disconnect', function (reason) {
            _this6.logined = false;
            console.error(reason);
        });

        // 用户数推送
        pomelo.on('playerAmountChange', function (d) {
            _this6.playerAmount = d.total;
            _this6.remainders = d.remain;
            console.group('playerAmountChange');
            console.log(d);
            console.groupEnd('playerAmountChange');
        });
        // 游戏进行状态
        pomelo.on('gameState', function (d) {
            _this6.start = d.state || 'stop';
            _this6.startAt = d.startAt;
            if (_this6.start == 'stop' || _this6.start == 'end') {
                _this6.question = '';
            }
            console.group('game-state');
            console.log(d);
            console.groupEnd('game-state');
        });
        // 比赛倒计时推送
        pomelo.on('gameCountdown', function (d) {
            _this6.countdown = d.time;
            console.group('countdown');
            console.log(d);
            console.groupEnd('countdown');
        });
        // 回合倒计时推送
        pomelo.on('onTurn', function (d) {
            _this6.turnCountdown = d.time;
        });
        // 题目推送
        pomelo.on('turnQuiz', function (d) {
            _this6.question = d.question;
            _this6.options = d.options;
            _this6.q_id = d.q_id;
            _this6.totalQuiz = d.total;
            _this6.order = d.order;
            _this6.picked = null;
            console.group('turnQuiz');
            console.log(d);
            console.groupEnd('turnQuiz');
            if (!_this6.lose) {
                _this6.cantEdit = false;
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
            var _this7 = this;

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

                    _this7.userName = data.nickname;
                    _this7.headimgurl = data.headimgurl;
                    _this7.openid = data.openid;
                    _this7.gender = data.sex;
                    _this7.dispatchServer();
                    console.log(d.data);
                }).catch(function (e) {
                    alert('出错');
                });
            }
        },

        // 获取服务器
        dispatchServer: function dispatchServer() {
            var _this8 = this;

            pomelo.init({
                host: window.location.hostname,
                port: 3014,
                log: true
            }, function () {
                pomelo.request('gate.gateHandler.queryEntry', {
                    uid: _this8.openid
                }, function (data) {
                    // 关闭入口
                    console.log(data);
                    pomelo.disconnect();
                    if (data.code == 500) {
                        console.log('login failed');

                        if (data.msg) {
                            _this8.errorMsg = data.msg;
                        }

                        return;
                    }
                    _this8.enter(data.host, data.port);
                });
            });
        },

        // 进入游戏
        enter: function enter(host, port) {
            var _this9 = this;

            pomelo.init({
                host: host,
                port: port,
                log: true
            }, function () {
                pomelo.request("connector.entryHandler.enter", {
                    username: _this9.userName,
                    openid: _this9.openid,
                    avatar: _this9.headimgurl,
                    sex: _this9.gender,
                    rid: 'quiz'
                }, function (data) {
                    console.log(data);
                    if (data.err) {
                        alert(data.err);
                        return;
                    }
                    _this9.logined = true;
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