"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.font = exports.sprite = exports.images = exports.setBaseUrl = void 0;
const path_1 = require("path");
const buster = require.main.require('./src/meta').config['cache-buster'];
let baseUrl = '';
function setBaseUrl(url) {
    baseUrl = url;
}
exports.setBaseUrl = setBaseUrl;
function images(pack) {
    return `.emoji-${pack.id} {` +
        'display: inline-block;' +
        'height: 23px;' +
        'margin-top: -1px;' +
        'margin-bottom: -1px;' +
        '}';
}
exports.images = images;
function sprite(pack) {
    const classes = Object.keys(pack.dictionary).map(name => `.emoji-${pack.id}.emoji--${name} {` +
        `background-position: ${pack.dictionary[name].backgroundPosition};` +
        '}');
    const route = `${baseUrl}/plugins/nodebb-plugin-emoji/emoji/${pack.id}`;
    return `.emoji-${pack.id} {
    background-image: url(${route}/${path_1.basename(pack.sprite.file)}?${buster});
    background-size: ${pack.sprite.backgroundSize};
    background-repeat: no-repeat;
    display: inline-block;
    height: 23px;
    width: 23px;
    overflow: hidden;
    font-size: 23px;
    line-height: 23px;
    text-align: center;
    vertical-align: bottom;
    color: transparent;
    margin-top: -1px;
    margin-bottom: -1px;
  }
  .emoji-link .emoji-${pack.id} {
    transform: scale(1.304347826086957);
    position: relative;
    bottom: -3.5px;
    height: 23px;
    width: 23px;
    font-size: 23px;
    line-height: 23px;
  }
  ${classes.join('')}`.split('\n').map(x => x.trim()).join('');
}
exports.sprite = sprite;
function font(pack) {
    const route = `${baseUrl}/plugins/nodebb-plugin-emoji/emoji/${pack.id}`;
    return `@font-face {
    font-family: '${pack.font.family}';
    ${(pack.font.eot ? `src: url(${route}/${path_1.basename(pack.font.eot)});` : '')}
    src: ${[
        pack.font.eot &&
            `url(${route}/${path_1.basename(pack.font.eot)}?#iefix) format('embedded-opentype')`,
        pack.font.woff2 &&
            `url(${route}/${path_1.basename(pack.font.woff2)}) format('woff2')`,
        pack.font.woff &&
            `url(${route}/${path_1.basename(pack.font.woff)}) format('woff')`,
        pack.font.ttf &&
            `url(${route}/${path_1.basename(pack.font.ttf)}) format('truetype')`,
        pack.font.svg &&
            `url(${route}/${path_1.basename(pack.font.svg)}) format('svg')`,
    ].filter(Boolean).join(', ')};
  }
  .emoji-${pack.id} {
    font-family: '${pack.font.family}';
    font-style: normal;
    display: inline-block;
    height: 23px;
    width: 23px;
    overflow: hidden;
    font-size: 23px;
    line-height: 23px;
    text-align: center;
    vertical-align: bottom;
    margin-top: -1px;
    margin-bottom: -1px;
  }`.split('\n').map(x => x.trim()).join('');
}
exports.font = font;
//# sourceMappingURL=css-builders.js.map