"use strict";
/* eslint-disable */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// ensure all packs have the correct peer dependency, repository url, and homepage url
const assert_1 = __importDefault(require("assert"));
const fs_1 = require("fs");
const path_1 = require("path");
const semver_1 = require("semver");
const packsDir = path_1.join(__dirname, '../../packs');
const packs = fs_1.readdirSync(packsDir).filter(dir => fs_1.statSync(path_1.join(packsDir, dir)).isDirectory());
const manifest = require('../../package.json');
packs.forEach((pack) => {
    const packManifest = require(`../../packs/${pack}/package.json`);
    assert_1.default.strictEqual(packManifest.repository.url, manifest.repository.url, `pack "${packManifest.name}: invalid repository url "${packManifest.repository.url}"`);
    assert_1.default(packManifest.homepage.startsWith(`${manifest.homepage}/tree/master/packs/`), `pack "${packManifest.name}: invalid homepage "${packManifest.homepage}"`);
    const range = packManifest.peerDependencies['nodebb-plugin-emoji'];
    assert_1.default(semver_1.satisfies(manifest.version, range), `pack "${packManifest.name}": peer dependency range "${range}" not satisfied by version "${manifest.version}"`);
});
//# sourceMappingURL=tests.js.map