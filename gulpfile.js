const gulp = require('gulp');
const del = require('del');

gulp.task('clean', () => {
    return del(['lib/**/*']);
})

var exec = require('child_process').exec;

gulp.task('trigger', function (cb) {
    body = "{\"request\":{\"branch\":\"master\"}}";
    curl = "curl -s -X POST " +
        "-H \"Content-Type: application/json\" " +
        "-H \"Accept: application/json\" " +
        "-H \"Travis-API-Version: 3\" " +
        "-H \"Authorization: token T9CQjkTkP8jyihk5sZxY\" " +

        "https://api.travis-ci.org/repo/fourctv%2FFourDAdmin/requests";
    console.log(curl);
    exec(curl, function (err, stdout, stderr) {
        console.log('out:' + stdout);
        console.log('err:' + stderr);
        //cb(err);
    });
})
