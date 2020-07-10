const { src, dest, series, parallel, watch } = require('gulp');
const loadPlugins = require('gulp-load-plugins');
const del = require('del');
const browserSync = require('browser-sync');
const cwd = process.cwd();
// const sass = require('gulp-sass');
// const babel = require('gulp-babel');

const plugins = loadPlugins();

const bs = browserSync.create();

let config = {
  build: {
    'src': 'src',
    'dist': 'dist',
    'temp': 'temp',
    'public': 'public',
    'paths': {
      'styles': 'assets/styles/*.scss',
      'scripts': 'assets/scripts/*.js',
      'pages': '*.html',
      'images': 'assets/images/**',
      'fonts': 'assets/fonts/**',
    },
  },
};
try {
  const loadConfig = require(`${cwd}/pages.config.js`);
  config = Object.assign({}, config, loadConfig);
} catch(e) {}

const clean = () => {
  return del([config.build.dist, config.build.temp]);
};
const style = () => {
  return src(config.build.paths.styles, { base:  config.build.src, cwd: config.build.src })
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(dest( config.build.temp))
    .pipe(bs.reload({ stream: true }));
};

const script = () => {
  return src( config.build.paths.scripts, { base:  config.build.src, cwd: config.build.src })
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest( config.build.temp))
    .pipe(bs.reload({ stream: true }));
};

const pages = () => {
  return src( config.build.paths.pages, { base:  config.build.src, cwd: config.build.src })
    .pipe(plugins.swig({ data: config.data, defaults: { cache: false } }))
    .pipe(dest( config.build.temp))
    .pipe(bs.reload({ stream: true }));
};

const images = () => {
  return src( config.build.paths.images, { base:  config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest( config.build.dist));
};
const fonts = () => {
  return src( config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest('dist'));
};

const others = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
};

const serve = () => {
  watch(config.build.paths.styles, { cwd: config.build.src }, style);
  watch(config.build.paths.scripts, { cwd: config.build.src }, script);
  watch(config.build.paths.pages, { cwd: config.build.src }, pages);

  watch([config.build.paths.images, config.build.paths.fonts], { cwd: config.build.src }, bs.reload);
  watch('**', { cwd: config.build.public }, bs.reload);
  bs.init({
    notify: false,
    port: 2020,
    // files: 'dist/**',
    server: {
      baseDir: [config.build.temp, config.build.src, config.build.public],
      routes: {
        '/node_modules': 'node_modules',
      }
    }
  });
};

const useref = () => {
  return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'], base: config.build.dist }))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true, // 清除html空白区
      minifyCSS: true, // 压缩html中css代码
      minifyJS: true, // 压缩html中js代码
    })))
    .pipe(dest(config.build.dist));
};

// const compression = () => {
//   return src(config.build.paths.pages, )
// };

// 组合构建：
const compile = parallel(style, script, pages);
const develop = series(compile, serve);
const build = series(
  clean,
  parallel(
    series(compile, useref),
    images,
    fonts,
    others,
  ),
);
module.exports = {
  clean,
  develop,
  build,
};
