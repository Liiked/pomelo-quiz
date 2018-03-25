'use strict';

var bus = new Vue();

var baseURL = '/api';
var opend_id = '';
var game_id = null;

/* Define the number of leaves to be used in the animation */
var NUMBER_OF_LEAVES = 30;

/* 
    Called when the "Falling Leaves" page is completely loaded.
*/
function init() {
    console.log('object');
    /* Get a reference to the element that will contain the leaves */
    var container = document.getElementById('leafContainer');
    /* Fill the empty container with new leaves */
    for (var i = 0; i < NUMBER_OF_LEAVES; i++) {
        container.appendChild(createALeaf());
    }
}

/*
    Receives the lowest and highest values of a range and
    returns a random integer that falls within that range.
*/
function randomInteger(low, high) {
    return low + Math.floor(Math.random() * (high - low));
}

/*
   Receives the lowest and highest values of a range and
   returns a random float that falls within that range.
*/
function randomFloat(low, high) {
    return low + Math.random() * (high - low);
}

/*
    Receives a number and returns its CSS pixel value.
*/
function pixelValue(value) {
    return value + 'px';
}

/*
    Returns a duration value for the falling animation.
*/

function durationValue(value) {
    return value + 's';
}

/*
    Uses an img element to create each leaf. "Leaves.css" implements two spin 
    animations for the leaves: clockwiseSpin and counterclockwiseSpinAndFlip. This
    function determines which of these spin animations should be applied to each leaf.
    
*/
function createALeaf() {
    /* Start by creating a wrapper div, and an empty img element */
    var leafDiv = document.createElement('div');
    var image = document.createElement('img');

    /* Randomly choose a leaf image and assign it to the newly created element */
    image.src = 'img/flower_' + randomInteger(1, 5) + '.jpg';

    leafDiv.style.top = "-100px";

    /* Position the leaf at a random location along the screen */
    leafDiv.style.left = pixelValue(randomInteger(0, 500));

    /* Randomly choose a spin animation */
    var spinAnimationName = Math.random() < 0.5 ? 'clockwiseSpin' : 'counterclockwiseSpinAndFlip';

    /* Set the -webkit-animation-name property with these values */
    leafDiv.style.webkitAnimationName = 'fade, drop';
    image.style.webkitAnimationName = spinAnimationName;

    /* Figure out a random duration for the fade and drop animations */
    var fadeAndDropDuration = durationValue(randomFloat(5, 11));

    /* Figure out another random duration for the spin animation */
    var spinDuration = durationValue(randomFloat(4, 8));
    /* Set the -webkit-animation-duration property with these values */
    leafDiv.style.webkitAnimationDuration = fadeAndDropDuration + ', ' + fadeAndDropDuration;

    var leafDelay = durationValue(randomFloat(0, 5));
    leafDiv.style.webkitAnimationDelay = leafDelay + ', ' + leafDelay;

    image.style.webkitAnimationDuration = spinDuration;

    // add the <img> to the <div>
    leafDiv.appendChild(image);

    /* Return this img element so it can be added to the document */
    return leafDiv;
}

var colorList = ["#FFFF99", "#B5FF91", "#94DBFF", "#FFBAFF", "#FFBD9D", "#C7A3ED", "#CC9898", "#8AC007", "#CCC007", "#FFAD5C"];
// for (var i = 0; i < lineList.length; i++) {
//     var bgColor = getColorByRandom(colorList);
// }

function getColorByRandom(colorList) {
    var colorIndex = Math.floor(Math.random() * colorList.length);
    var color = colorList[colorIndex];
    colorList.splice(colorIndex, 1);
    return color;
}

var result = {
    key: 'result',
    template: '#result',
    props: ['win', 'playerAmount', 'reward', 'game_id'],
    data: function data() {
        return {
            winnerList: null,
            remainders: 0,
            showDialog: false,
            form: {
                name: null,
                phone: null,
                work_number: null
            },
            submited: false
        };
    },
    mounted: function mounted() {
        var _this = this;

        if (this.win) {
            console.log('win is ', this.win);
            init();
        }

        bus.$on('win-change', function (d) {
            _this.win = d;
            console.log('win is change ', _this.win);
            if (d) {
                init();
            }
        });
        setTimeout(function (_) {
            _this.getGameResult(_this.game_id);
        }, 100);
    },

    computed: {
        eachReward: function eachReward() {
            return (Number(this.reward) / Number(this.remainders)).toFixed(0);
        }
    },
    methods: {
        getGameResult: function getGameResult(id) {
            var _this2 = this;

            if (!this.game_id) {
                alert('未取到id');
                return;
            }
            axios.get(baseURL + '/getResult/' + (this.game_id || id)).then(function (d) {
                if (d.msg) {
                    alert(d.msg);
                    return;
                }
                _this2.remainders = d.data.length;
                d.data.forEach(function (d) {
                    return d['show'] = false;
                });
                _this2.winnerList = d.data;
                _this2.winnerList.forEach(function (d, i) {
                    _this2.showItem(d, i);
                });
            }).catch(function (e) {
                console.error(e);
                _this2.$ons.notification.toast('网络不佳，请联系管理员获取结果', {
                    timeout: 2000
                });
            });
        },
        showItem: function showItem(data, id) {
            setTimeout(function (_) {
                data.show = true;
            }, id * 200);
        },
        verifyForm: function verifyForm() {
            var notify = this.$ons.notification.toast;
            if (!this.form.name) {
                notify('请填写您的姓名', {
                    timeout: 1500
                });
                return false;
            }
            if (this.form.phone.length != 11 || !isPhoneNum(this.form.phone)) {
                notify('请填写有效的手机号码', {
                    timeout: 1500
                });
                return false;
            }
            if (!this.form.work_number) {
                notify('请填写您的工号', {
                    timeout: 1500
                });
                return false;
            }

            function isPhoneNum(str) {
                return (/^(0|86|17951)?(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/.test(str)
                );
            }

            return true;
        },
        submitForm: function submitForm() {
            var _this3 = this;

            if (!this.verifyForm()) {
                return;
            }
            var sendData = JSON.parse(JSON.stringify(this.form));
            sendData['openid'] = opend_id;
            sendData['game_id'] = game_id;
            console.log(sendData);
            axios.post('http://quizadmin.prowertech.com/quiz/user-info', sendData, {
                withCredentials: true
            }).then(function (d) {
                var data = d.data;

                if (data.code = -1) {
                    _this3.$ons.notification.toast('哎呀，服务器出错了，请联系工作人员', {
                        timeout: 1500
                    });
                    return;
                }

                _this3.showDialog = false;
                _this3.submited = true;
            }).catch(function (e) {
                console.error(e);
                _this3.$ons.notification.toast('哎呀，服务器出错了，请联系工作人员', {
                    timeout: 1500
                });
            });
        }
    }
};

var quiz = {
    key: 'quiz',
    template: '#quiz',
    props: ['reward', 'game_id'],
    data: function data() {
        return {
            // 题目
            quizTitle: '巴拉巴拉哈哈哈哈航啊', //题目标题
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
            win: false
        };
    },
    mounted: function mounted() {
        var _this4 = this;

        // 收发器

        bus.$on('game-state-coming', function (d) {
            _this4.start = d;
        });

        bus.$on('remainders', function (d) {
            _this4.remainders = d.remainders;
            _this4.playerAmount = d.playerAmount;
        });

        bus.$on('quiz-coming', function (d) {
            if (!_this4.right) {
                _this4.lose = true;
            }
            if (_this4.turnIndex > 0 && !_this4.picked && !_this4.lose) {
                _this4.lose = true;
                _this4.kickoutMsg = '您已经放弃答题，请在下一轮游戏中再接再厉';
                _this4.emptyAnswer(_this4.quizID, _this4.turnIndex, 0);
            }
            _this4.initQuestion();
            console.log(d);
            _this4.turnIndex = d.turnIndex;
            _this4.turnTotal = d.turnTotal;
            _this4.quizTitle = d.quizTitle;
            _this4.options = d.options;
            _this4.quizID = d.quizID;
        });

        bus.$on('turn-countdown', function (d) {
            _this4.turnCountdown = d.time;
            _this4.remainders = d.remainders;
            _this4.playerAmount = d.playerAmount;
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
                    reward: this.reward,
                    game_id: this.game_id
                }
            });
        },
        pickChange: function pickChange(item) {
            if (!this.tappable) {
                return;
            }
            this.picked = item.key;
            console.log(item);
        },

        // 答题、获取游戏结果
        answer: function answer(id) {
            var _this5 = this;

            console.group('my answer');
            console.log({
                rid: 'quiz',
                quiz_id: this.quizID,
                order_id: this.turnIndex,
                answer: id
            });
            console.groupEnd('my answer');

            pomelo.request("game.gameHandler.send", {
                rid: 'quiz',
                quiz_id: this.quizID,
                order_id: this.turnIndex,
                answer: id
            }, function (data) {
                console.group('ansewer');
                console.log(data);
                console.groupEnd('ansewer');
                if (data.error) {
                    _this5.$ons.notification.toast('服务器出错了，抱歉', {
                        timeout: 2000
                    });
                    return;
                }
                if (data.win) {
                    _this5.win = true;
                }

                _this5.right = data.result;
                _this5.rightAnswer = data.answer;
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
                console.log('quiz win is ', this.win);
                this.pushNext();
            }
        },
        picked: function picked(latest, old) {
            if (!latest) {
                return;
            }
            this.tappable = 0;
            this.answer(latest);
        },
        win: function win(v) {
            bus.$emit('win-change', v);
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
            game_id: null,
            // express服务器数据
            showGameInfo: false,
            willStartAt: '',
            beforeStart: '',
            reward: 0,
            readyID: null
        };
    },
    mounted: function mounted() {
        var _this6 = this;

        this.getGameInfo();

        bus.$on('user-coming', function (d) {
            _this6.logined = d.logined;
            _this6.userName = d.userName;
            _this6.openid = d.openid;
            _this6.gender = d.gender;
            _this6.headimgurl = d.headimgurl;
        });

        bus.$on('error-coming', function (d) {
            _this6.loginError = d;
        });

        // 倒计时和游戏开始
        bus.$on('countdown-coming', function (d) {
            _this6.countdown = d.countdown;
            _this6.gameStartAt = d.startAt;
        });
        bus.$on('game-state-coming', function (d) {
            _this6.start = d;
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
            var _this7 = this;

            axios.get(baseURL + '/getGame', {
                timeout: 10000
            }).then(function (d) {
                var data = d.data;
                if (data.start != -1) {
                    _this7.willStartAt = data.start;
                    _this7.beforeStart = data.beforeStart;
                    _this7.reward = data.reward;
                    _this7.game_id = data.game_id;
                    window.game_id = data.game_id;
                    if (!_this7.gameStartAt) {
                        _this7.showGameInfo = true;
                        _this7.readyToGo();
                    }
                }

                console.log(d);
            }).catch(function (e) {
                console.error(e);
                if (e.message && e.message.indexOf('timeout') != -1) {
                    alert('当前网络不佳，请刷新页面后重试');
                } else {
                    alert('express 服务出错');
                }
            });
        },
        readyToGo: function readyToGo() {
            var _this8 = this;

            this.readyID = setInterval(function (_) {
                var nowToStart = Number(moment.unix(_this8.willStartAt).diff(moment()) / 1000).toFixed(0);
                var diff = Number(nowToStart) - 60 * Number(_this8.beforeStart);
                if (diff < 0) {
                    clearInterval(_this8.readyID);
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
                        reward: this.reward,
                        game_id: this.game_id
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
            reconnectCount: 0,

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
        var _this9 = this;

        this.wechatLogin();

        // 用户断开连接
        pomelo.on('disconnect', function (reason) {
            if (_this9.start != 'stop') {
                if (reconnectCount > 30) {
                    _this9.$ons.notification.toast('您的网络已经断开，无法连接', {
                        timeout: 2000
                    });
                    return;
                }
                _this9.$ons.notification.toast('当前网络不佳，正在重新连接', {
                    timeout: 1000
                });
                _this9.reconnectCount++;
            }
            _this9.logined = false;
            console.error(reason);
        });

        // 用户数推送
        pomelo.on('playerAmountChange', function (d) {
            _this9.playerAmount = d.total;
            _this9.remainders = d.remain;
            console.group('playerAmountChange');
            console.log(d);
            console.groupEnd('playerAmountChange');
        });
        // 游戏进行状态
        pomelo.on('gameState', function (d) {
            _this9.start = d.state || 'stop';
            _this9.startAt = d.startAt;
            if (_this9.start == 'stop' || _this9.start == 'end') {
                _this9.question = '';
            }
            console.group('game-state');
            console.log(d);
            console.groupEnd('game-state');
        });
        // 比赛倒计时推送
        pomelo.on('gameCountdown', function (d) {
            _this9.countdown = d.time;
            console.group('countdown');
            console.log(d);
            console.groupEnd('countdown');
        });
        // 回合倒计时推送
        pomelo.on('onTurn', function (d) {
            _this9.turnCountdown = d.time;
        });
        // 题目推送
        pomelo.on('turnQuiz', function (d) {
            _this9.question = d.question;
            _this9.options = d.options;
            _this9.q_id = d.q_id;
            _this9.totalQuiz = d.total;
            _this9.order = d.order;
            _this9.picked = null;
            console.group('turnQuiz');
            console.log(d);
            console.groupEnd('turnQuiz');
            if (!_this9.lose) {
                _this9.cantEdit = false;
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
            var _this10 = this;

            var param = GetRequest();
            if (!param.code) {
                axios.get(baseURL + '/getAppid').then(function (d) {
                    var data = d.data;
                    console.warn(data);
                    if (data.msg) {
                        alert(data.msg);
                        return;
                    } else {
                        var url = encodeURIComponent('http://' + location.host + '/quiz/');
                        location.href = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + data.appID + '&redirect_uri=' + url + '&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect';
                    }
                }).catch(function (e) {
                    alert(JSON.stringify(e));
                    console.error(e);
                });
            } else {
                axios.get(baseURL + '/getUerInfo/' + param.code).then(function (d) {
                    var data = d.data;

                    if (data.errcode == 40001) {
                        location.href = '//' + location.host + '/quiz/';
                    }

                    _this10.userName = data.nickname;
                    _this10.headimgurl = data.headimgurl;
                    _this10.openid = data.openid;
                    window.opend_id = data.openid;
                    _this10.gender = data.sex;
                    _this10.dispatchServer();
                    console.log(d.data);
                }).catch(function (e) {
                    console.error(e);
                    alert('无法获取用户信息');
                });
            }
        },

        // 获取服务器
        dispatchServer: function dispatchServer() {
            var _this11 = this;

            pomelo.init({
                host: window.location.hostname,
                port: 3014,
                log: true
            }, function () {
                pomelo.request('gate.gateHandler.queryEntry', {
                    uid: _this11.openid
                }, function (data) {
                    // 关闭入口
                    console.log(data);
                    pomelo.disconnect();
                    if (data.code == 500) {
                        console.log('login failed');

                        if (data.msg) {
                            _this11.errorMsg = data.msg;
                        }

                        return;
                    }
                    _this11.enter(data.host, data.port);
                });
            });
        },

        // 进入游戏
        enter: function enter(host, port) {
            var _this12 = this;

            pomelo.init({
                host: host,
                port: port,
                log: true,
                reconnect: true,
                maxReconnectAttempts: 30
            }, function () {
                pomelo.request("connector.entryHandler.enter", {
                    username: _this12.userName,
                    openid: _this12.openid,
                    avatar: _this12.headimgurl,
                    sex: _this12.gender,
                    rid: 'quiz'
                }, function (data) {
                    console.log(data);
                    if (data.err) {
                        alert(data.err);
                        return;
                    }
                    _this12.logined = true;
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