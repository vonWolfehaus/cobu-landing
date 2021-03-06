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
var dist = './docs';

gulp.task('default', ['clean'], function(cb) {
	runSequence(
		['scripts'],
		['styles', 'assets', 'pages'],
		['reorg'],
		['prod-clean'],
		cb);
});

gulp.task('clean', del.bind(null, [dist]));

gulp.task('prod-clean', function(cb) {
	del.sync([dist+'/**/*.map', '!'+dist]);
});

/*
	Compiles and builds styles
 */
gulp.task('styles', function() {
	return gulp.src(['assets/styles/**/*.styl', 'components/**/*.styl'])
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
	return gulp.src('assets/**/*.{png,jpg,svg,ico}')
		.pipe(gulp.dest(dist));
});

/*
	Generates an HTML file for each md file in pages directory
 */
gulp.task('pages', function () {
	return gulp.src('content/*.md')
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.frontMatter({property: 'page', remove: true}))
		.pipe($.marked())
		.pipe(applyTemplate())
		.pipe($.htmlmin({
			removeComments: true,
			collapseWhitespace: true
		}))
		.pipe($.foreach(function(stream, file) {
			// place each page into its own directory as the index file for more friendly URLs
			var name = path.basename(file.path, '.html');
			return stream
				.pipe($.rename('index.html'))
				.pipe($.if((name === 'index'), gulp.dest(dist)))
				.pipe($.if((name !== 'index'), gulp.dest(dist+'/'+name)));
		}));
});

/*
	Shift some things around to tidy up
 */
gulp.task('reorg', function(cb) {
	runSequence(
		['move-404'],
		['del-mess'],
		cb);
});
gulp.task('move-404', function () {
	return gulp.src(dist+'/404/index.html')
		.pipe($.rename('404.html'))
		.pipe(gulp.dest(dist));
});
gulp.task('del-mess', function(cb) {
	del.sync([dist+'/404/']);
	del.sync([dist+'/legal/']);
	del.sync([dist+'/community/']);
});

/*
	Combines component scripts
 */
gulp.task('scripts', function () {
	return gulp.src('components/**/*.js')
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.sourcemaps.init())
		.pipe($.concat('scripts.js'))
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest(dist+'/js'));
});

/*
	Fires up a server for development
 */
gulp.task('dev', ['styles', 'assets', 'pages', 'scripts'], function() {
	browserSync.init({
		notify: false,
		server: {
			baseDir: [dist]
		}
	});

	gulp.watch(['assets/styles/**/*.styl', 'components/**/*.styl'], ['styles', reload]);
	gulp.watch(['components/**/*.js'], ['scripts', reload]);
	gulp.watch(['templates/*.html', 'content/**/*.md', 'components/**/*.html'], ['pages', reload]);
	gulp.watch(['assets/**/*.{png,jpg,svg,ico}'], ['assets', reload]);
});


/*----------------------------------------------------------------------
	HELPERS
*/

/**
 * Generates an HTML file based on a template and file metadata
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
