var bus = new Vue();

var quiz = {
    key: 'quiz',
    template: '#quiz',
    data() {
        return {
            // 题目
            quizTitle: '巴拉巴拉哈哈哈哈航啊',
            quizMsg: '',
            questions: [],
            turnIndex: 0,
            turnTotal: 0,
            turnCountdown: 0,

            // 游戏人数
            playerAmount: 0,
            remainders: 0, //剩余人数

            // 
            picked: 0,
            // 游戏状态
            gameOver: false,
            kickoutMsg: '您已答错过题目，不可以继续作答了哦'
        }
    },
    mounted() {
        // 收发器
        bus.$on('quiz-coming', d => {
            this.questions = d;
        })
        bus.$emit('turnIndex-merge', d => {
            this.turnIndex = d;
        })
        bus.$emit('turnTotal-merge', d => {
            this.turnTotal = d;
        })
    },
    methods: {
        push() {
            this.$emit('push-page', quiz);
        },
        pickChange(e) {
            if (this.gameOver) {
                e.preventDefault();
                return;
            }
        }
    }
};

var welcome = {
    key: 'welcome',
    template: '#welcome',
};

var result = {
    key: 'result',
    template: '#result',
    data () {
        return {
            gameEnd: true
        }
    },
    methods: {
        push() {
            this.$emit('push-page', quiz);
        }
    }
};

var app = new Vue({
    el: '#app',
    template: '#main',
    data() {
        return {
            pageStack: [quiz],

            quizTitle: '',
            // 轮次数据
            questions: [{
                    "key": 1,
                    "value": "墨子——“兼爱”“非攻”"
                },
                {
                    "key": 2,
                    "value": "韩非——“春秋无义战”"
                },
                {
                    "key": 3,
                    "value": "韩非——“春秋无义战”"
                },
                {
                    "key": 4,
                    "value": "韩非——“春秋无义战”"
                }
            ],
            turnIndex: 0,
            turnTotal: 0
        };
    },
    mounted() {
        bus.$emit('quiz-coming', this.questions)
        bus.$emit('turnIndex-merge', this.turnIndex)
        bus.$emit('turnTotal-merge', this.turnTotal)
    },
});