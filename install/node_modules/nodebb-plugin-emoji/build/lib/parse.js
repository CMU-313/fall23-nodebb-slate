"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.post = exports.raw = exports.buildEmoji = exports.setOptions = exports.clearCache = void 0;
const fs_extra_1 = require("fs-extra");
const build_1 = require("./build");
const buster = require.main.require('./src/meta').config['cache-buster'];
const winston = require.main.require('winston');
let metaCache = null;
function clearCache() {
    metaCache = null;
}
exports.clearCache = clearCache;
const escapeRegExpChars = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
const getTable = async () => {
    if (metaCache) {
        return metaCache;
    }
    const [tableText, aliasesText, asciiText, charactersText,] = await Promise.all([
        fs_extra_1.readFile(build_1.tableFile, 'utf8'),
        fs_extra_1.readFile(build_1.aliasesFile, 'utf8'),
        fs_extra_1.readFile(build_1.asciiFile, 'utf8'),
        fs_extra_1.readFile(build_1.charactersFile, 'utf8'),
    ]);
    const table = JSON.parse(tableText);
    const aliases = JSON.parse(aliasesText);
    const ascii = JSON.parse(asciiText);
    const characters = JSON.parse(charactersText);
    const asciiPattern = Object.keys(ascii)
        .sort((a, b) => b.length - a.length)
        .map(escapeRegExpChars)
        .join('|');
    const charPattern = Object.keys(characters)
        .sort((a, b) => b.length - a.length)
        .map(escapeRegExpChars)
        .join('|');
    metaCache = {
        table,
        aliases,
        ascii,
        characters,
        asciiPattern: asciiPattern ?
            new RegExp(`(^|\\s|\\n)(${asciiPattern})(?=\\n|\\s|$)`, 'g') :
            /(?!)/,
        charPattern: charPattern ?
            new RegExp(charPattern, 'g') :
            /(?!)/,
    };
    return metaCache;
};
const outsideCode = /(^|<\/code>)([^<]*|<(?!code[^>]*>))*(<code[^>]*>|$)/g;
const outsideElements = /(<[^>]*>)?([^<>]*)/g;
const emojiPattern = /:([a-z\-.+0-9_]+):/g;
const options = {
    ascii: false,
    native: false,
    baseUrl: '',
};
function setOptions(newOptions) {
    Object.assign(options, newOptions);
}
exports.setOptions = setOptions;
const buildEmoji = (emoji, whole) => {
    if (emoji.image) {
        const route = `${options.baseUrl}/plugins/nodebb-plugin-emoji/emoji/${emoji.pack}`;
        return `<img
      src="${route}/${emoji.image}?${buster}"
      class="not-responsive emoji emoji-${emoji.pack} emoji--${emoji.name}"
      title="${whole}"
      alt="${emoji.character}"
    />`;
    }
    return `<span
    class="emoji emoji-${emoji.pack} emoji--${emoji.name}"
    title="${whole}"
  ><span>${emoji.character}</span></span>`;
};
exports.buildEmoji = buildEmoji;
const replaceAscii = (str, { ascii, asciiPattern, table }) => str.replace(asciiPattern, (full, before, text) => {
    const emoji = ascii[text] && table[ascii[text]];
    if (emoji) {
        return `${before}${exports.buildEmoji(emoji, text)}`;
    }
    return full;
});
const replaceNative = (str, { characters, charPattern, table }) => str.replace(charPattern, (char) => {
    const name = characters[char];
    if (table[name]) {
        return `:${name}:`;
    }
    return char;
});
const parse = async (content) => {
    if (!content) {
        return content;
    }
    let store;
    try {
        store = await getTable();
    }
    catch (err) {
        winston.error('[emoji] Failed to retrieve data for parse', err);
        return content;
    }
    const { table, aliases } = store;
    const parsed = content.replace(outsideCode, outsideCodeStr => outsideCodeStr.replace(outsideElements, (_, inside, outside) => {
        let output = outside;
        if (options.native) {
            // avoid parsing native inside HTML tags
            // also avoid converting ascii characters
            output = output.replace(/(<[^>]+>)|([^0-9a-zA-Z`~!@#$%^&*()\-=_+{}|[\]\\:";'<>?,./\s\n]+)/g, (full, tag, text) => {
                if (text) {
                    return replaceNative(text, store);
                }
                return full;
            });
        }
        output = output.replace(emojiPattern, (whole, text) => {
            const name = text.toLowerCase();
            const emoji = table[name] || table[aliases[name]];
            if (emoji) {
                return exports.buildEmoji(emoji, whole);
            }
            return whole;
        });
        if (options.ascii) {
            // avoid parsing native inside HTML tags
            output = output.replace(/(<[^>]+>)|([^<]+)/g, (full, tag, text) => {
                if (text) {
                    return replaceAscii(text, store);
                }
                return full;
            });
        }
        return (inside || '') + (output || '');
    }));
    return parsed;
};
function raw(content) {
    return parse(content);
}
exports.raw = raw;
async function post(data) {
    // eslint-disable-next-line no-param-reassign
    data.postData.content = await parse(data.postData.content);
    return data;
}
exports.post = post;
//# sourceMappingURL=parse.js.map