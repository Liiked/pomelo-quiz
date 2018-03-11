const gulp = require('gulp')
const babel = require('gulp-babel')
const autoprefixer = require('gulp-autoprefixer')
const rev = require('gulp-rev')
const revReplace = require('gulp-rev-replace')
const useref = require('gulp-useref')
const sequence = require('gulp-sequence')
const del = require('del');

gulp.task('js', function() {
    return gulp.src('./public/js/index.js')
    .pipe(babel())
    .pipe(gulp.dest('./public'))
});

gulp.task('clean', function() {
    del('./build')
});

gulp.task('replace', function() {
    return gulp.src('./public/index.html')
    .pipe(useref())
    .pipe(rev())
    .pipe(revReplace())
    .pipe(gulp.dest('./build'))
});

gulp.task('css',function(){
    gulp.src('./public/css/index.css')
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade:true,
        }))
      .pipe(gulp.dest('./public/build'))
})

// 主要任务
gulp.task('build', sequence('clean','css','replace'));


gulp.task('watch', function() {
    gulp.watch('./public/js/index.js', ['js']);
});