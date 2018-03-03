const redis = require('./../../database/index');
const moment = require('moment');

const GAME_STATE = {
    0: 'stop',
    1: 'start',
    2: 'playing'
}

let Game = function () {
    // 回调
    this.stateCallback = null;
    this.countdownCallback = null;
    this.turnCountdownCallback = null;
    this.questionCallback = null;

    // 轮次相关
    let _question = {} // 每轮问题
    let _turnCountdown = 0; // 每轮倒计时

    // 游戏相关
    let _gameCountdown = 0; // 游戏开始倒计时 单位秒
    this.config = {};
    let _gameState = 'stop'; // 游戏是否开始
    this.gameIntervalID = null; //游戏配置轮询

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
                this.questionCallback(_question.id, _question.order, _question.title, _question.options);
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

    this.timeOut(interval, quizLength, (i) => {
        if (index >= quizLength) {
            console.log('game restart');
            this.gameState = GAME_STATE[0]
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
            console.log('looping');
            let config = JSON.parse(d);
            let gameStartCountdown = config.to_start ? Number(config.to_start) * 60 : 300;
            let startTime = config.start_time;
            let toNow = Number(moment.unix(startTime).diff(moment()) / 1000).toFixed(0);
            // 游戏开始
            if (toNow > 0 && toNow <= gameStartCountdown) {
                console.log('game start');
                this.config = config;
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

module.exports = new Game();