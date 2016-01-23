'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var path = require('path');
var through = require('through2');
var swig = require('swig');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;

var dist = 'dist';

gulp.task('default', ['clean'], function(cb) {
	runSequence(
		['styles', 'pages'],
		cb);
});


/*----------------------------------------------------------------------
	Development tasks
*/

gulp.task('styles', function() {
	return gulp.src([components+'/**/*.styl'])
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.sourcemaps.init())
		.pipe($.stylus({
			compress: true
		}))
		.pipe($.autoprefixer())
		.pipe($.csso())
		.pipe($.concat('styles.css'))
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest(dist))
});

gulp.task('clean', del.bind(null, [dist]));


/*----------------------------------------------------------------------
	Landing page tasks
*/

/**
 * Generates an HTML file for each md file in pages directory.
 */
gulp.task('pages', function () {
	return gulp.src('pages/*.md')
		.pipe($.frontMatter({property: 'page', remove: true}))
		.pipe($.marked())
		.pipe(applyTemplate())
		.pipe($.rename({extname: '.html'}))
		.pipe(gulp.dest(dist));
});

gulp.task('serve', function() {
	browserSync.init({
		notify: false,
		server: {
			baseDir: ['.']
		}
	});

	watch();
});


/*----------------------------------------------------------------------
	HELPERS
*/

/**
 * Site metadata for use with templates.
 * @type {Object}
 */
var site = {};

/**
 * Generates an HTML file based on a template and file metadata.
 */
function applyTemplate() {
	return through.obj(function(file, enc, cb) {
		var data = {
			site: site,
			page: file.page,
			content: file.contents.toString()
		};

		var templateFile = path.join(__dirname, 'templates', file.page.layout + '.html');
		var tpl = swig.compileFile(templateFile, {cache: false});
		file.contents = new Buffer(tpl(data), 'utf8');
		this.push(file);
		cb();
	});
}

/**
 * Defines the list of resources to watch for changes.
 */
function watch() {
	gulp.watch(['src/**/*.{styl,css}'], ['styles', 'styles-grid', 'styletemplates', reload]);
	gulp.watch(['src/**/*.html'], ['pages', reload]);
	gulp.watch(['src/**/*.{svg,png,jpg}'], ['images', reload]);
	gulp.watch(['templates/**/*'], ['templates', reload]);
}

/**
 * Handle errors so the stream isn't broken, and pops up an OS alert to keep the user informed of build errors
 */
function handleErrors() {
	var args = Array.prototype.slice.call(arguments);
	// Send error to notification center with gulp-notify
	$.notify.onError({
		title: "Build error",
		message: "<%= error%>",
		showStack: true
	}).apply(this, args);

	// Keep gulp from hanging on this task
	this.emit('end');
}
