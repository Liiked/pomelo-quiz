const gulp = require('gulp')
const babel = require('gulp-babel')

gulp.task('js', function() {
    return gulp.src('./public/js/index.js')
    .pipe(babel())
    .pipe(gulp.dest('./public'))
});


gulp.task('watch', function() {
    gulp.watch('./public/js/index.js', ['js']);
});