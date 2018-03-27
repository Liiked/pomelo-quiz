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
    var spinAnimationName = (Math.random() < 0.5) ? 'clockwiseSpin' : 'counterclockwiseSpinAndFlip';

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
    data() {
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
        }
    },
    mounted() {
        if (this.win) {
            console.log('win is ', this.win);
            init()
        }

        bus.$on('win-change', d => {
            this.win = d
            console.log('win is change ', this.win);
            if (d) {
                init()
            }
        })
        setTimeout(_ => {
            this.getGameResult(this.game_id)
        }, 100)
    },
    computed: {
        eachReward() {
            return (Number(this.reward) / Number(this.remainders)).toFixed(0)
        }
    },
    methods: {
        getGameResult(id) {
            if (!this.game_id) {
                alert('未取到id')
                return
            }
            axios.get(baseURL + '/getResult/' + (this.game_id || id)).then(d => {
                if (d.msg) {
                    alert(d.msg)
                    return
                }
                this.remainders = d.data.length;
                d.data.forEach(d => d['show'] = false)
                this.winnerList = d.data;
                this.winnerList.forEach((d, i) => {
                    this.showItem(d, i)
                })
            }).catch(e => {
                console.error(e);
                this.$ons.notification.toast('网络不佳，请联系管理员获取结果', {
                    timeout: 2000
                })
            })
        },
        showItem(data, id) {
            setTimeout(_ => {
                data.show = true
            }, id * 200)
        },
        verifyForm() {
            let notify = this.$ons.notification.toast;
            if (!this.form.name) {
                notify('请填写您的姓名', {
                    timeout: 1500
                })
                return false;
            }
            if (this.form.phone.length != 11 || !isPhoneNum(this.form.phone)) {
                notify('请填写有效的手机号码', {
                    timeout: 1500
                })
                return false;
            }
            if (!this.form.work_number) {
                notify('请填写您的工号', {
                    timeout: 1500
                })
                return false;
            }

            function isPhoneNum(str) {
                return /^(0|86|17951)?(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/.test(str)
            }

            return true;
        },
        submitForm() {
            if (!this.verifyForm()) {
                return
            }
            let sendData = JSON.parse(JSON.stringify(this.form));
            sendData['openid'] = opend_id;
            sendData['game_id'] = game_id;
            console.log(sendData);
            axios.post('http://quizadmin.prowertech.com/quiz/user-info', sendData, {
                withCredentials: true
            }).then(d => {
                let data = d.data;
                if (data.code == -1) {
                    this.$ons.notification.toast('哎呀，服务器出错了，请联系工作人员', {
                        timeout: 1500
                    })
                    return;
                }

                this.showDialog = false;
                this.submited = true;
            }).catch(e => {
                alert(JSON.stringify(e));
                console.error(e);
                this.$ons.notification.toast('哎呀，服务器出错了，请联系工作人员', {
                    timeout: 1500
                })
            })


        }
    }
};

var quiz = {
    key: 'quiz',
    template: '#quiz',
    props: ['reward', 'game_id'],
    data() {
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
        }
    },
    mounted() {
        // 收发器

        bus.$on('game-state-coming', (d) => {
            this.start = d;
        })

        bus.$on('remainders', (d) => {
            this.remainders = d.remainders
            this.playerAmount = d.playerAmount
        })

        bus.$on('quiz-coming', d => {
            if (!this.right) {
                this.lose = true
            }
            if (this.turnIndex > 0 && !this.picked && !this.lose) {
                this.lose = true;
                this.kickoutMsg = '您已经放弃答题，请在下一轮游戏中再接再厉'
                this.emptyAnswer(this.quizID, this.turnIndex, 0)
            }
            this.initQuestion()
            console.log(d);
            this.turnIndex = d.turnIndex
            this.turnTotal = d.turnTotal
            this.quizTitle = d.quizTitle
            this.options = d.options
            this.quizID = d.quizID
        })

        bus.$on('turn-countdown', d => {
            this.turnCountdown = d.time;
            this.remainders = d.remainders
            this.playerAmount = d.playerAmount
        })

    },
    methods: {
        pushNext() {
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
        pickChange(item) {
            if (!this.tappable) {
                return;
            }
            this.picked = item.key;
            console.log(item);
        },
        // 答题、获取游戏结果
        answer(id) {
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
            }, data => {
                console.group('ansewer')
                console.log(data);
                console.groupEnd('ansewer')
                if (data.error) {
                    this.$ons.notification.toast('服务器出错了，抱歉', {
                        timeout: 2000,
                    })
                    return;
                }
                if (data.win) {
                    this.win = true
                }

                this.right = data.result
                this.rightAnswer = data.answer
            });
        },
        emptyAnswer(quizID, turnIndex, id) {
            pomelo.request("game.gameHandler.send", {
                rid: 'quiz',
                quiz_id: quizID,
                order_id: turnIndex,
                answer: id
            }, data => {
                console.log('empty answer');
            });
        },
        initQuestion() {
            console.log('ex-----------');
            if (this.lose) {
                this.tappable = 0;
            } else {
                this.tappable = 1;
            }
            this.right = -1;
            this.rightAnswer = -1;
            this.picked = 0;

        },
    },
    watch: {
        start(v) {
            if (v == 'stop') {
                console.log('quiz win is ', this.win);
                this.pushNext()
            }
        },
        picked(latest, old) {
            if (!latest) {
                return;
            }
            this.tappable = 0
            this.answer(latest)
        },
        win(v) {
            bus.$emit('win-change', v)
        }
    },
};

var welcome = {
    key: 'welcome',
    template: '#welcome',
    data() {
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
        }
    },
    mounted() {
        this.getGameInfo()

        bus.$on('user-coming', (d) => {
            this.logined = d.logined
            this.userName = d.userName
            this.openid = d.openid
            this.gender = d.gender
            this.headimgurl = d.headimgurl
        })

        bus.$on('error-coming', (d) => {
            this.loginError = d;
        })

        // 倒计时和游戏开始
        bus.$on('countdown-coming', (d) => {
            this.countdown = d.countdown;
            this.gameStartAt = d.startAt;
        })
        bus.$on('game-state-coming', (d) => {
            this.start = d;
        })

    },
    computed: {
        gameState() {
            let a = {
                start: '游戏即将开始',
                playing: '游戏正在进行',
                end: '游戏结束',
                stop: '游戏尚未就绪'
            }
            return a[this.start]
        },
        startAt() {
            if (!this.gameStartAt) {
                return ''
            }
            return moment.unix(this.gameStartAt).format('YYYY年MM月DD日 HH:mm:ss')
        },
        willStart() {
            if (!this.willStartAt) {
                return ''
            }
            return moment.unix(this.willStartAt).format('YYYY年MM月DD日 HH:mm:ss')
        }
    },
    methods: {
        getGameInfo() {
            axios.get(baseURL + '/getGame', {
                timeout: 10000
            }).then(d => {
                var data = d.data;
                if (data.start != -1) {
                    this.willStartAt = data.start
                    this.beforeStart = data.beforeStart
                    this.reward = data.reward
                    this.game_id = data.game_id
                    window.game_id = data.game_id
                    if (!this.gameStartAt) {
                        this.showGameInfo = true
                        this.readyToGo()
                    }
                }

                console.log(d);
            }).catch(e => {
                console.error(e);
                if (e.message && e.message.indexOf('timeout') != -1) {
                    alert('当前网络不佳，请刷新页面后重试')
                } else {
                    alert('express 服务出错')
                }
            })
        },
        readyToGo() {
            this.readyID = setInterval(_ => {
                var nowToStart = Number(moment.unix(this.willStartAt).diff(moment()) / 1000).toFixed(0)
                var diff = Number(nowToStart) - 60 * Number(this.beforeStart)
                if (diff < 0) {
                    clearInterval(this.readyID)
                    location.reload()
                }
            }, 15000)
        }
    },
    watch: {
        start(v) {
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
        gameStartAt(v) {
            if (v) {
                this.showGameInfo = false
                clearTimeout(this.readyID)
            }

        }
    }
};

var app = new Vue({
    el: '#app',
    template: '#main',
    data() {
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
            turnCountdown: 0,
        };
    },
    mounted() {
        this.wechatLogin();

        // 用户断开连接
        pomelo.on('disconnect', reason => {
            if (this.start != 'stop') {
                if (reconnectCount > 30) {
                    this.$ons.notification.toast('您的网络已经断开，无法连接', {
                        timeout: 2000
                    })
                    return;
                }
                this.$ons.notification.toast('当前网络不佳，正在重新连接', {
                    timeout: 1000
                })
                this.reconnectCount ++;
            }
            this.logined = false
            console.error(reason);
        });

        // 用户数推送
        pomelo.on('playerAmountChange', d => {
            this.playerAmount = d.total;
            this.remainders = d.remain;
            console.group('playerAmountChange')
            console.log(d);
            console.groupEnd('playerAmountChange')
        });
        // 游戏进行状态
        pomelo.on('gameState', d => {
            this.start = d.state || 'stop';
            this.startAt = d.startAt
            if (this.start == 'stop' || this.start == 'end') {
                this.question = ''
            }
            console.group('game-state')
            console.log(d);
            console.groupEnd('game-state')
        });
        // 比赛倒计时推送
        pomelo.on('gameCountdown', d => {
            this.countdown = d.time
            console.group('countdown')
            console.log(d);
            console.groupEnd('countdown')
        });
        // 回合倒计时推送
        pomelo.on('onTurn', d => {
            this.turnCountdown = d.time
        });
        // 题目推送
        pomelo.on('turnQuiz', d => {
            this.question = d.question
            this.options = d.options
            this.q_id = d.q_id
            this.totalQuiz = d.total
            this.order = d.order
            this.picked = null
            console.group('turnQuiz')
            console.log(d);
            console.groupEnd('turnQuiz')
            if (!this.lose) {
                this.cantEdit = false
            }
        });
    },
    watch: {
        logined(latest, old) {
            if (latest) {
                var data = {
                    userName: this.userName,
                    openid: this.openid,
                    gender: this.gender,
                    headimgurl: this.headimgurl,
                    logined: latest
                }
                bus.$emit('user-coming', data)
            }
        },
        errorMsg(latest, old) {
            bus.$emit('error-coming', latest);
        },
        countdown(latest) {
            var data = {
                countdown: latest,
                startAt: this.startAt
            }
            // 进入游戏
            if (latest == 1) {
                this.$emit('push-page', quiz);

                bus.$emit('remainders', {
                    remainders: this.remainders,
                    playerAmount: this.playerAmount
                });
            }
            bus.$emit('countdown-coming', data);
        },
        start(latest) {
            bus.$emit('game-state-coming', latest);
        },
        // 回合
        turnCountdown(v) {
            bus.$emit('turn-countdown', {
                time: v,
                remainders: this.remainders,
                playerAmount: this.playerAmount
            })
        },
        order(v) {
            bus.$emit('quiz-coming', {
                turnIndex: v,
                turnTotal: this.totalQuiz,
                quizTitle: this.question,
                options: this.options,
                quizID: this.q_id
            })
        },
        remain(v) {
            bus.$emit('remainders', {
                remainders: v,
                playerAmount: this.playerAmount
            });
        }
    },
    methods: {
        wechatLogin() {
            let param = GetRequest();
            if (!param.code) {
                axios.get(baseURL + '/getAppid').then(d => {
                    let data = d.data
                    console.warn(data);
                    if (data.msg) {
                        alert(data.msg)
                        return;
                    } else {
                        let url = encodeURIComponent('http://' + location.host + '/quiz/')
                        location.href = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' +
                            data.appID +
                            '&redirect_uri=' +
                            url +
                            '&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect'
                    }
                }).catch(e => {
                    alert(JSON.stringify(e));
                    console.error(e);
                })
            } else {
                axios.get(baseURL + '/getUerInfo/' + param.code).then(d => {
                    let data = d.data;

                    if (data.errcode == 40001) {
                        location.href = '//' + location.host + '/quiz/'
                    }

                    this.userName = data.nickname
                    this.headimgurl = data.headimgurl
                    this.openid = data.openid
                    window.opend_id = data.openid;
                    this.gender = data.sex
                    this.dispatchServer()
                    console.log(d.data);
                }).catch(e => {
                    console.error(e);
                    alert('无法获取用户信息')
                })
            }
        },
        // 获取服务器
        dispatchServer() {
            pomelo.init({
                host: window.location.hostname,
                port: 3014,
                log: true
            }, () => {
                pomelo.request('gate.gateHandler.queryEntry', {
                    uid: this.openid
                }, (data) => {
                    // 关闭入口
                    console.log(data);
                    pomelo.disconnect();
                    if (data.code == 500) {
                        console.log('login failed');

                        if (data.msg) {
                            this.errorMsg = data.msg;
                        }



                        return
                    }
                    this.enter(data.host, data.port)
                });
            })
        },
        // 进入游戏
        enter(host, port) {
            pomelo.init({
                host: host,
                port: port,
                log: true,
                reconnect: true,
                maxReconnectAttempts: 30
            }, () => {
                pomelo.request("connector.entryHandler.enter", {
                    username: this.userName,
                    openid: this.openid,
                    avatar: this.headimgurl,
                    sex: this.gender,
                    rid: 'quiz'
                }, data => {
                    console.log(data);
                    if (data.err) {
                        alert(data.err)
                        return;
                    }
                    this.logined = true;
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
            theRequest[strs[i].split("=")[0]] = (strs[i].split("=")[1]);
        }
    }
    return theRequest;
}