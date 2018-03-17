const redis = require('./../../database/index');
const moment = require('moment');
const axios = require('axios')
const adminConfig = require('./adminPushConfig')
console.log(adminConfig);

const GAME_STATE = {
    0: 'stop',
    1: 'start',
    2: 'playing',
    3: 'end'
}

let Game = function () {
    // 回调
    this.stateCallback = null;
    this.countdownCallback = null;
    this.turnCountdownCallback = null;
    this.questionCallback = null;
    this.playerAmountCallback = null;

    // 轮次相关
    let _question = {} // 每轮问题
    let _turnCountdown = 0; // 每轮倒计时

    // 游戏相关
    let _gameCountdown = 0; // 游戏开始倒计时 单位秒
    this.config = {};
    this.redis = null; // redis
    let _gameState = 'stop'; // 游戏是否开始
    this.gameIntervalID = null; //游戏配置轮询
    _remainPlayer = 0; // 剩余人数
    this.playerAmount = 0; // 游戏人数
    this.winers = [] // 胜利者

    // 从redis中读取配置

    this.gameLoop.call(this)

    Object.defineProperty(this, 'gameState', {
        set(v) {
            if (_gameState == v) {
                return
            }

            _gameState = v
            if (this.stateCallback && v) {
                this.stateCallback(_gameState);
            }
        },
        get() {
            return _gameState
        }
    })

    Object.defineProperty(this, 'gameCountdown', {
        set(v) {
            _gameCountdown = v;
            if (this.countdownCallback && v > 0) {
                this.countdownCallback(_gameCountdown);
            }
        },
        get() {
            return _gameCountdown;
        }
    })

    Object.defineProperty(this, 'remainPlayer', {
        set(v) {
            _remainPlayer = v;
            if (this.playerAmountCallback) {
                this.playerAmountCallback(_remainPlayer);
            }
        },
        get() {
            return _remainPlayer;
        }
    })

    Object.defineProperty(this, 'turnCountdown', {
        set(v) {
            _turnCountdown = v;
            if (this.turnCountdownCallback && Number(v) > 0) {
                this.turnCountdownCallback(_turnCountdown);
            }
        },
        get() {
            return _turnCountdown;
        }
    })

    Object.defineProperty(this, 'gameQuestions', {
        set(v) {
            _question = v;
            console.log('quest change');
            if (this.questionCallback) {
                this.questionCallback(_question.id, _question.order, _question.total, _question.title, _question.options);
            }
        },
        get() {
            return _question;
        }
    })
}

/**
 * 
 * @param second {Number} the interval second
 * @param limit {Number} how many times the second go around,"-1" means unlimited loop
 * @param cb {Function} receive [count] form each countdown
 * @param endCallback {Function} invoke when timeout
 * @return intervalID
 */
Game.prototype.timeOut = function timeOut(second, limit, cb, endCallback) {
    let count = limit;

    if (limit && typeof cb == 'function') {
        cb(count)
    }

    // 无限制循环
    if (limit < 0) {
        let id = setInterval(function () {
            cb(++count)
        }, second * 1000)
        return id
    }

    let id = setInterval(function () {
        if (count > 0) {
            count--;
            cb(count)
        } else {
            clearInterval(id)
            if (typeof endCallback == 'function') {
                endCallback(count)
            }
        }
    }, second * 1000)
    return id
}

// 轮次管理
Game.prototype.turnLoop = function (config, interval) {
    let quiz = config.quiz;
    let quizLength = quiz.length;
    let index = 0;
    let turnID = null;
    quiz.forEach((e, i) => {
        e['order'] = i + 1;
        e['total'] = quizLength;
    });

    this.timeOut(interval, quizLength, (i) => {
        if (index >= quizLength) {
            // 游戏结束
            this.gameState = GAME_STATE[3]
            // let winners = this.winers.length;
            // let total = this.playerAmount;
            // let winLen = this.remainPlayer;
            // console.log('game end-------------');
            // console.log('winner is', this.config.id, total, winners);

            gameEnd(this.config.id)

            axios.post(adminConfig.adminURL, {
                game_id: this.config.id
            }).then(d => {
                console.log(d.data);
            }).catch(e => {
                console.error(e);
            })
            this.gameLoop()
            return
        }
        this.gameState = GAME_STATE[2]
        this.gameQuestions = quiz[index]
        this.timeOut(1, interval, (count) => {
            this.turnCountdown = count;
        })
        index++;
    })
}

// 游戏redis轮询
Game.prototype.gameLoop = function () {
    // 初始化
    this.gameState = GAME_STATE[0];
    this.config = {}
    this.playerAmount = 0; // 游戏人数
    this.winers = []
    this.gameCountdown = 0
    this.remainPlayer = 0
    this.turnCountdown = 0
    this.redis = {}
    this.gameQuestions = {}
    this.gameIntervalID = this.timeOut(10, -1, (index) => {
        if (this.gameState == 'start') {
            clearInterval(this.gameIntervalID);
            return;
        }
        redis.get('game').then(d => {
            // 没有数据
            if (!d) {
                console.log('没有数据');
                return;
            }
            // 游戏配置
            let config = JSON.parse(d);
            let gameStartCountdown = config.to_start ? Number(config.to_start) * 60 : 300;
            let startTime = config.start_time;
            let toNow = Number(moment.unix(startTime).diff(moment()) / 1000).toFixed(0);
            // 游戏开始
            if (toNow > 0 && toNow <= gameStartCountdown) {
                console.log('game start');
                this.config = config;
                // 清空数据，以便初始化
                redis.del('game:' + config.id)
                redis.set(`gameResult:${config.id}`, '')

                // 业务
                this.redis = new gameRedis('game:' + config.id)
                redis.set(`gameResult:${config.id}`, JSON.stringify({
                    "id": config.id,
                    "endTimestamp": '',
                    "winner_amount": 0,
                    "player_amount": 0,
                    'winners':[],
                    'reward': config.reward,
                    'remain_players': 0
                }))
                this.gameState = GAME_STATE[1]

                // 游戏开始倒计时
                this.timeOut(1, toNow, (i) => {
                    this.gameCountdown = i;
                }, (e) => {
                    this.turnLoop(this.config, this.config.interval)
                })

                clearInterval(this.gameIntervalID);
            }

        })
    })
}

// hm redis封装
function gameRedis(key) {
    let k = key;
    this.set = (field, val, cb) => {
        try {
            return redis.hmset(k, field, val)
        } catch (error) {
            console.error(error);
        }
    }
    this.get = (field, cb) => {
        try {
            return redis.hmget(k, field)
        } catch (error) {
            console.error(error);
        }
    }
}

// 计算胜利
function gameEnd(id) {
    // redis.hvals()
    let result = 'gameResult:' + id

    redis.get(result).then(d => {
        let data = JSON.parse(d)
        data['endTimestamp'] = moment().unix()
        redis.set(result, JSON.stringify(data))
    })
}

// 配置校验
function gameVerify(config) {
    if (typeof config != 'object') {
        console.error('游戏配置格式有误');
        return false
    }
    if (!config.id) {
        console.error('游戏未配置id');
        return false
    }
}

module.exports = new Game();