var app = new Vue({
    el: "#app",
    data: {
        // 登录
        errorMsg: '',
        playerAmount: 0,
        start: 'stop', // 游戏是否开始

        // 用户信息
        logined: false,
        userName: '',
        lose: false,
        win: false,

        // 倒计时
        countdown: 0,
        turnCountdown: 0,

        // 问题
        question: '',
        q_id: null,
        options: [],
        getRight: false,
        cantEdit: false,

        // 答案
        picked: ''
    },
    beforeMount() {
        // 用户断开连接
        pomelo.on('disconnect', reason => {
            this.logined = false
            console.error(reason);
        });

        // 用户数推送
        pomelo.on('playerAmountChange', d => {
            this.playerAmount = d.total;
        });
        // 游戏进行状态
        pomelo.on('gameState', d => {
            this.start = d.state || 'stop';
            if (this.start == 'stop') {
                this.question = ''
            }
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
            this.o_id = d.o_id
            this.picked = null

            if (!this.lose) {
                this.cantEdit = false
            }
        });
    },
    methods: {
        // 获取服务器
        dispatchServer() {
            pomelo.init({
                host: window.location.hostname,
                port: 3014,
                log: true
            }, () => {
                pomelo.request('gate.gateHandler.queryEntry', {
                    uid: this.userName
                }, (data) => {
                    // 关闭入口
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
                log: true
            }, () => {
                pomelo.request("connector.entryHandler.enter", {
                    username: this.userName,
                    rid: 'quiz'
                }, data => {
                    if (data.error) {
                        return;
                    }
                    this.logined = true;
                });
            });
        },
        // 答题、获取游戏结果
        answer(id) {
            id = this.picked
            this.cantEdit = true
            pomelo.request("game.gameHandler.send", {
                player: this.userName,
                rid: 'quiz',
                quiz_id: this.q_id,
                order_id: this.o_id,
                answer: id
            }, data => {
                if (data.error) {
                    this.errorMsg = '服务器出现错误了，抱歉'
                    return;
                }
                this.getRight = data.answer
                if (!data.answer) {
                    this.lose = true
                }
                if (data.win) {
                    this.win = true
                }
                
                console.log(data);
            });
        },
    },
    watch: {
        picked (new_val, old_val) {
            if (new_val) {
                this.answer(new_val)
            }
        },
        getRight (new_val) {
            if (new_val) {
                setTimeout(()=>{
                    this.getRight = false
                },1000)
            }
        }
    },
    computed: {
        gameState () {
            let a = {
                start: '游戏开始',
                playing: '游戏正在进行',
                stop: '游戏尚未就绪'
            }
            return a[this.start]
        }
    }
})