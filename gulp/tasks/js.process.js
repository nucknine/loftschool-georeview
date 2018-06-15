'use strict';

module.exports = function() {
    $.gulp.task('js:process', function() {
        return $.gulp.src($.path.app)
        .pipe($.gp.eslint())
        .pipe($.gp.eslint.format())
        .pipe($.webpackStream($.webpackConfig))
        .pipe($.gp.uglify())
        .pipe($.gp.rename({ suffix: '.min' }))
        .pipe($.gulp.dest($.config.root + '/assets/js'));
    });
};