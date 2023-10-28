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
Object.defineProperty(exports, "__esModule", { value: true });
exports.packsFile = exports.categoriesFile = exports.charactersFile = exports.asciiFile = exports.aliasesFile = exports.tableFile = exports.assetsDir = void 0;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const lodash_1 = require("lodash");
const cssBuilders = __importStar(require("./css-builders"));
const base_url_1 = require("./base-url");
const parse_1 = require("./parse");
const customizations_1 = require("./customizations");
const nconf = require.main.require('nconf');
const winston = require.main.require('winston');
const plugins = require.main.require('./src/plugins');
exports.assetsDir = path_1.join(__dirname, '../emoji');
const linkDirs = (sourceDir, destDir) => {
    const type = (process.platform === 'win32') ? 'junction' : 'dir';
    return fs_extra_1.symlink(sourceDir, destDir, type);
};
exports.tableFile = path_1.join(exports.assetsDir, 'table.json');
exports.aliasesFile = path_1.join(exports.assetsDir, 'aliases.json');
exports.asciiFile = path_1.join(exports.assetsDir, 'ascii.json');
exports.charactersFile = path_1.join(exports.assetsDir, 'characters.json');
exports.categoriesFile = path_1.join(exports.assetsDir, 'categories.json');
exports.packsFile = path_1.join(exports.assetsDir, 'packs.json');
async function build() {
    winston.verbose('[emoji] Building emoji assets');
    // fetch the emoji definitions
    const { packs } = await plugins.hooks.fire('filter:emoji.packs', { packs: [] });
    // filter out invalid ones
    const filtered = packs.filter((pack) => {
        if (pack && pack.id && pack.name && pack.mode && pack.dictionary && pack.path) {
            return true;
        }
        winston.warn('[emoji] pack invalid: ', pack.path || pack.id);
        return false;
    });
    winston.verbose(`[emoji] Loaded packs: ${filtered.map(pack => pack.id).join(', ')}`);
    await fs_extra_1.remove(exports.assetsDir);
    await fs_extra_1.mkdirp(exports.assetsDir);
    const customizations = await customizations_1.getAll();
    const table = {};
    const aliases = {};
    const ascii = {};
    const characters = {};
    const categoriesInfo = {};
    const packsInfo = [];
    packs.forEach((pack) => {
        packsInfo.push({
            name: pack.name,
            id: pack.id,
            attribution: pack.attribution,
            license: pack.license,
        });
        Object.keys(pack.dictionary).forEach((key) => {
            const name = key.toLowerCase();
            const emoji = pack.dictionary[key];
            if (!table[name]) {
                table[name] = {
                    name,
                    character: emoji.character || `:${name}:`,
                    image: emoji.image || '',
                    pack: pack.id,
                    aliases: emoji.aliases || [],
                    keywords: emoji.keywords || [],
                };
            }
            if (!characters[emoji.character]) {
                characters[emoji.character] = name;
            }
            if (emoji.aliases) {
                emoji.aliases.forEach((alias) => {
                    const a = alias.toLowerCase();
                    if (!aliases[a]) {
                        aliases[a] = name;
                    }
                });
            }
            if (emoji.ascii) {
                emoji.ascii.forEach((str) => {
                    if (!ascii[str]) {
                        ascii[str] = name;
                    }
                });
            }
            const categories = emoji.categories || ['other'];
            categories.forEach((category) => {
                categoriesInfo[category] = categoriesInfo[category] || [];
                categoriesInfo[category].push(name);
            });
        });
    });
    Object.keys(categoriesInfo).forEach((category) => {
        categoriesInfo[category] = lodash_1.uniq(categoriesInfo[category]);
    });
    Object.values(customizations.emojis).forEach((emoji) => {
        const name = emoji.name.toLowerCase();
        table[name] = {
            name,
            character: `:${name}:`,
            pack: 'customizations',
            keywords: [],
            image: emoji.image,
            aliases: emoji.aliases,
        };
        emoji.aliases.forEach((alias) => {
            const a = alias.toLowerCase();
            if (!aliases[a]) {
                aliases[a] = name;
            }
        });
        emoji.ascii.forEach((str) => {
            if (!ascii[str]) {
                ascii[str] = name;
            }
        });
        categoriesInfo.custom = categoriesInfo.custom || [];
        categoriesInfo.custom.push(name);
    });
    Object.values(customizations.adjuncts).forEach((adjunct) => {
        const name = adjunct.name;
        if (!table[name]) {
            return;
        }
        table[name] = {
            ...table[name],
            aliases: table[name].aliases.concat(adjunct.aliases),
        };
        adjunct.aliases.forEach((alias) => { aliases[alias] = name; });
        adjunct.ascii.forEach((str) => { ascii[str] = name; });
    });
    // generate CSS styles
    cssBuilders.setBaseUrl(base_url_1.getBaseUrl());
    const css = packs.map(pack => cssBuilders[pack.mode](pack)).join('\n');
    const cssFile = `${css}\n.emoji-customizations {
    display: inline-block;
    height: 23px;
    margin-top: -1px;
    margin-bottom: -1px;
  }`.split('\n').map(x => x.trim()).join('');
    // handling copying or linking necessary assets
    const assetOperations = packs.map(async (pack) => {
        const dir = path_1.join(exports.assetsDir, pack.id);
        if (pack.mode === 'images') {
            await linkDirs(path_1.resolve(pack.path, pack.images.directory), dir);
        }
        else if (pack.mode === 'sprite') {
            const filename = path_1.basename(pack.sprite.file);
            await fs_extra_1.mkdirp(dir);
            await fs_extra_1.copy(path_1.resolve(pack.path, pack.sprite.file), path_1.join(dir, filename));
        }
        else { // pack.mode === 'font'
            const fontFiles = [
                pack.font.eot,
                pack.font.svg,
                pack.font.woff,
                pack.font.ttf,
                pack.font.woff2,
            ].filter(Boolean);
            await fs_extra_1.mkdirp(dir);
            await Promise.all(fontFiles.map(async (file) => {
                const filename = path_1.basename(file);
                fs_extra_1.copy(path_1.resolve(pack.path, file), path_1.join(dir, filename));
            }));
        }
    });
    await Promise.all([
        ...assetOperations,
        // store CSS styles
        fs_extra_1.writeFile(path_1.join(exports.assetsDir, 'styles.css'), cssFile, { encoding: 'utf8' }),
        // persist metadata to disk
        fs_extra_1.writeFile(exports.tableFile, JSON.stringify(table)),
        fs_extra_1.writeFile(exports.aliasesFile, JSON.stringify(aliases)),
        fs_extra_1.writeFile(exports.asciiFile, JSON.stringify(ascii)),
        fs_extra_1.writeFile(exports.charactersFile, JSON.stringify(characters)),
        fs_extra_1.writeFile(exports.categoriesFile, JSON.stringify(categoriesInfo)),
        fs_extra_1.writeFile(exports.packsFile, JSON.stringify(packsInfo)),
        // link customizations to public/uploads/emoji
        linkDirs(path_1.join(nconf.get('upload_path'), 'emoji'), path_1.join(exports.assetsDir, 'customizations')),
    ]);
    parse_1.clearCache();
}
exports.default = build;
//# sourceMappingURL=build.js.map