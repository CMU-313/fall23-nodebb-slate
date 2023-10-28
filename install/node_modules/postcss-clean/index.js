'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var postcss = _interopDefault(require('postcss'));
var CleanCss = _interopDefault(require('clean-css'));

var initializer = function (opts) {
  if ( opts === void 0 ) opts = {};

  var cleancss = new CleanCss(opts);

  return {
    postcssPlugin: 'clean',
    Once: function Once(css, ref) {
      var result = ref.result;

      return new Promise(function (resolve, reject) {
        cleancss.minify(css.toString(), function (err, min) {
          if (err) {
            return reject(new Error(err.join('\n')))
          }

          for (var i = 0, list = min.warnings; i < list.length; i += 1) {
            var w = list[i];

            result.warn(w);
          }

          result.root = postcss.parse(min.styles);
          resolve();
        });
      })
    }
  }
};
initializer.postcss = true;

module.exports = initializer;
