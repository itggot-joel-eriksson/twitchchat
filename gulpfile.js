var gulp = require("gulp"),
    sass = require("gulp-sass"),
    autoprefixer = require("gulp-autoprefixer");

gulp.task("sass", function () {
    gulp.src("sass/*.sass")
        .pipe(sass({
            outputStyle: "expanded",
            indentType: "tab",
            indentWidth: 1
        }))
        .pipe(gulp.dest("css"));
});

gulp.task("watch", function() {
    gulp.watch("sass/*.sass", ["sass"]);
    gulp.watch("css/*.css", function() {
        gulp.src("css/*.css")
            .pipe(autoprefixer({
                browsers: ["last 3 versions"],
                cascade: false
            }))
            .pipe(gulp.dest("css"));
    });
});

gulp.task("default", ["sass", "watch"], function() {

});
