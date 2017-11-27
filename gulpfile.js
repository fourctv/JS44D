const gulp = require('gulp');
const del = require('del');

gulp.task('clean', () => {
    return del(['lib/**/*']);
})

var exec = require('child_process').exec;

gulp.task('trigger', function (cb) {
    curl = "curl -s -X POST " +
        "-H \"Content-Type: application/json\" " +
        "-H \"Accept: application/json\" " +
        "-H \"Travis-API-Version: 3\" " +
        "-H \"Authorization: token viET3ax59ZQs3SJ5dXKxXQ\" " +
        "https://api.travis-ci.org/repo/fourctv%2Ffourdadmin/requests";
    console.log(curl);
    exec(curl, function (err, stdout, stderr) {
        console.log('out:' + stdout);
        console.log('err:' + stderr);
        //cb(err);
    });
})
