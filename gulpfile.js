const gulp = require('gulp'),
      sass = require('gulp-sass'),
      server = require('browser-sync').create(),
      gulpnodemon = require('gulp-nodemon')

const styles = () => {
    return gulp.src('./client/public/sass/**/*.sass')
        .pipe(sass())
        .pipe(gulp.dest('./client/public/css'))
}
const reload = (done) => {
    server.reload()
    done()
}
  
const serve = (done) => {
    server.init({
      proxy: 'http://localhost:3000',
      files: ["client/public/**/*.*"],
      port: 5000
    })
    done()
}
const nodemon = (done) => {
    gulpnodemon({
        script: 'index.js'
    })
    done()
}
const watch = () => {
    gulp.watch('./client/public/sass/**/*.sass', gulp.series(styles, reload))
    gulp.watch('./client/views/**/*.*', gulp.series(reload))
}
gulp.task('watch', gulp.series(watch))
gulp.task('default', gulp.series(styles, nodemon, serve, watch))