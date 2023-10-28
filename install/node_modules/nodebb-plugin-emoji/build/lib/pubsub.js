"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = void 0;
const os_1 = require("os");
const build_1 = __importDefault(require("./build"));
const nconf = require.main.require('nconf');
const winston = require.main.require('winston');
const pubsub = require.main.require('./src/pubsub');
const primary = nconf.get('isPrimary') === 'true' || nconf.get('isPrimary') === true;
async function build() {
    if (pubsub.pubClient) {
        pubsub.publish('emoji:build', {
            hostname: os_1.hostname(),
        });
    }
    if (primary) {
        await build_1.default();
    }
}
exports.build = build;
const logErrors = (err) => {
    if (err) {
        winston.error(err);
    }
};
if (primary) {
    pubsub.on('emoji:build', (data) => {
        if (data.hostname !== os_1.hostname()) {
            build_1.default().catch(logErrors);
        }
    });
}
//# sourceMappingURL=pubsub.js.map