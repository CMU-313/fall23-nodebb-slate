"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.configGet = exports.addStylesheet = exports.composerFormatting = exports.adminMenu = exports.init = void 0;
const settings = __importStar(require("./settings"));
const parse = __importStar(require("./parse"));
exports.parse = parse;
const build_1 = require("./build");
const pubsub_1 = require("./pubsub");
const controllers_1 = __importDefault(require("./controllers"));
const base_url_1 = require("./base-url");
const nconf = require.main.require('nconf');
const buster = require.main.require('./src/meta').config['cache-buster'];
const file = require.main.require('./src/file');
async function init(params) {
    controllers_1.default(params);
    const sets = await settings.get();
    const { parseAscii, parseNative } = sets;
    const baseUrl = base_url_1.getBaseUrl();
    // initialize parser flags
    parse.setOptions({
        ascii: parseAscii,
        native: parseNative,
        baseUrl,
    });
    // always build on startup if in dev mode
    const shouldBuild = nconf.any('build_emoji', 'BUILD_EMOJI') ||
        // otherwise, build if never built before
        !(await file.exists(build_1.tableFile));
    if (shouldBuild) {
        await pubsub_1.build();
    }
}
exports.init = init;
async function adminMenu(header) {
    header.plugins.push({
        route: '/plugins/emoji',
        icon: 'fa-smile-o',
        name: 'Emoji',
    });
    return header;
}
exports.adminMenu = adminMenu;
async function composerFormatting(data) {
    data.options.push({
        name: 'emoji-add-emoji',
        className: 'fa fa-smile-o emoji-add-emoji',
        title: '[[emoji:composer.title]]',
    });
    return data;
}
exports.composerFormatting = composerFormatting;
async function addStylesheet(data) {
    const baseUrl = base_url_1.getBaseUrl();
    data.links.push({
        rel: 'stylesheet',
        href: `${baseUrl}/plugins/nodebb-plugin-emoji/emoji/styles.css?${buster}`,
    });
    return data;
}
exports.addStylesheet = addStylesheet;
async function configGet(config) {
    const customFirst = await settings.getOne('customFirst');
    // eslint-disable-next-line no-param-reassign
    config.emojiCustomFirst = customFirst;
    return config;
}
exports.configGet = configGet;
//# sourceMappingURL=index.js.map