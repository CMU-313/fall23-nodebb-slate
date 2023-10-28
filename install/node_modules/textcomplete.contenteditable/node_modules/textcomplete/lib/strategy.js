"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _query = require("./query");

var _query2 = _interopRequireDefault(_query);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_INDEX = 2;

function DEFAULT_TEMPLATE(value) {
  return value;
}

/**
 * Properties for a strategy.
 *
 * @typedef
 */

/**
 * Encapsulate a single strategy.
 */
var Strategy = function () {
  function Strategy(props) {
    _classCallCheck(this, Strategy);

    this.props = props;
    this.cache = props.cache ? {} : null;
  }

  /**
   * @return {this}
   */


  _createClass(Strategy, [{
    key: "destroy",
    value: function destroy() {
      this.cache = null;
      return this;
    }

    /**
     * Build a Query object by the given string if this matches to the string.
     *
     * @param {string} text - Head to input cursor.
     */

  }, {
    key: "buildQuery",
    value: function buildQuery(text) {
      if (typeof this.props.context === "function") {
        var _context = this.props.context(text);
        if (typeof _context === "string") {
          text = _context;
        } else if (!_context) {
          return null;
        }
      }
      var match = this.matchText(text);
      return match ? new _query2.default(this, match[this.index], match) : null;
    }
  }, {
    key: "search",
    value: function search(term, callback, match) {
      if (this.cache) {
        this.searchWithCache(term, callback, match);
      } else {
        this.props.search(term, callback, match);
      }
    }

    /**
     * @param {object} data - An element of array callbacked by search function.
     */

  }, {
    key: "replace",
    value: function replace(data) {
      return this.props.replace(data);
    }

    /** @private */

  }, {
    key: "searchWithCache",
    value: function searchWithCache(term, callback, match) {
      var _this = this;

      if (this.cache && this.cache[term]) {
        callback(this.cache[term]);
      } else {
        this.props.search(term, function (results) {
          if (_this.cache) {
            _this.cache[term] = results;
          }
          callback(results);
        }, match);
      }
    }

    /** @private */

  }, {
    key: "matchText",
    value: function matchText(text) {
      if (typeof this.match === "function") {
        return this.match(text);
      } else {
        return text.match(this.match);
      }
    }

    /** @private */

  }, {
    key: "match",
    get: function get() {
      return this.props.match;
    }

    /** @private */

  }, {
    key: "index",
    get: function get() {
      return typeof this.props.index === "number" ? this.props.index : DEFAULT_INDEX;
    }
  }, {
    key: "template",
    get: function get() {
      return this.props.template || DEFAULT_TEMPLATE;
    }
  }]);

  return Strategy;
}();

exports.default = Strategy;
//# sourceMappingURL=strategy.js.map