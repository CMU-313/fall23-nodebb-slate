"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setOne = exports.getOne = exports.set = exports.get = void 0;
const settings = require.main.require('./src/meta').settings;
const defaults = {
    parseNative: true,
    parseAscii: true,
    customFirst: false,
};
function fromStore(key, x) {
    var _a;
    if (typeof x === typeof defaults[key]) {
        return x;
    }
    if (typeof x === 'string') {
        try {
            return (_a = JSON.parse(x)) !== null && _a !== void 0 ? _a : defaults[key];
        }
        catch {
            return defaults[key];
        }
    }
    return defaults[key];
}
async function get() {
    const data = await settings.get('emoji');
    return {
        parseNative: fromStore('parseNative', data === null || data === void 0 ? void 0 : data.parseNative),
        parseAscii: fromStore('parseAscii', data === null || data === void 0 ? void 0 : data.parseAscii),
        customFirst: fromStore('customFirst', data === null || data === void 0 ? void 0 : data.customFirst),
    };
}
exports.get = get;
async function set(data) {
    await settings.set('emoji', {
        parseNative: JSON.stringify(data.parseNative),
        parseAscii: JSON.stringify(data.parseAscii),
        customFirst: JSON.stringify(data.customFirst),
    });
}
exports.set = set;
async function getOne(field) {
    const val = await settings.getOne('emoji', field);
    return fromStore(field, val);
}
exports.getOne = getOne;
async function setOne(field, value) {
    await settings.setOne('emoji', field, JSON.stringify(value));
}
exports.setOne = setOne;
//# sourceMappingURL=settings.js.map