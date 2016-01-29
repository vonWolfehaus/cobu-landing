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

var site = require('./site.json');
var dist = './dist';

gulp.task('default', ['clean'], function(cb) {
	runSequence(
		['styles', 'assets', 'pages'],
		cb);
});

gulp.task('clean', del.bind(null, [dist]));

/*
	Compiles and builds styles
 */
gulp.task('styles', function() {
	return gulp.src(['assets/styles/**/*.styl'])
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.sourcemaps.init())
		.pipe($.stylus({
			compress: true
		}))
		.pipe($.autoprefixer())
		.pipe($.csso())
		.pipe($.concat('styles.css'))
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest(dist+'/css'))
});

/*
	Copies images, keeping folder structure
 */
gulp.task('assets', function () {
	return gulp.src('assets/**/*.{png,jpg,svg}')
		.pipe(gulp.dest(dist));
});

/*
	Generates an HTML file for each md file in pages directory.
 */
gulp.task('pages', function () {
	return gulp.src('content/*.md')
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.frontMatter({property: 'page', remove: true}))
		.pipe($.marked())
		.pipe(applyTemplate())
		.pipe($.htmlmin({collapseWhitespace: true}))
		.pipe($.rename({extname: '.html'}))
		.pipe(gulp.dest(dist));
});

/*
	Fires up a server for development
 */
gulp.task('dev', ['default'], function() {
	browserSync.init({
		notify: false,
		server: {
			baseDir: [dist]
		}
	});

	watch();
});

gulp.task('deploy', ['default'], function() {
	return gulp.src(dist+'/**/*.*')
		.pipe($.ghPages());
});


/*----------------------------------------------------------------------
	HELPERS
*/

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

		var templateFile = path.join(__dirname, 'templates', file.page.template + '.html');
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
	gulp.watch(['assets/styles/**/*.styl'], ['styles', reload]);
	gulp.watch(['templates/*.html', 'content/**/*.md'], ['pages', reload]);
	gulp.watch(['assets/**/*.{png,jpg,svg,ico}'], ['assets', reload]);
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
