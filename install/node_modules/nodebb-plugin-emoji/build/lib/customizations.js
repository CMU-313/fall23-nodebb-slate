"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.edit = exports.add = exports.getAll = void 0;
const db = require.main.require('./src/database');
const emojisKey = 'emoji:customizations:emojis';
const adjunctsKey = 'emoji:customizations:adjuncts';
async function getAll() {
    const [emojis, adjuncts] = await Promise.all([
        db.getSortedSetRangeWithScores(emojisKey, 0, -1),
        db.getSortedSetRangeWithScores(adjunctsKey, 0, -1),
    ]);
    return {
        emojis: Object.fromEntries(emojis.map(({ value, score }) => [score, JSON.parse(value)])),
        adjuncts: Object.fromEntries(adjuncts.map(({ value, score }) => [score, JSON.parse(value)])),
    };
}
exports.getAll = getAll;
async function add({ type, item }) {
    const key = type === 'emoji' ? emojisKey : adjunctsKey;
    // get maximum score from set
    const [result] = await db.getSortedSetRevRangeWithScores(key, 0, 1);
    const lastId = (result && result.score) || 1;
    const id = lastId + 1;
    await db.sortedSetAdd(key, id, JSON.stringify(item));
    return id;
}
exports.add = add;
async function edit({ type, id, item }) {
    const key = type === 'emoji' ? emojisKey : adjunctsKey;
    await db.sortedSetsRemoveRangeByScore([key], id, id);
    await db.sortedSetAdd(key, id, JSON.stringify(item));
}
exports.edit = edit;
async function remove({ type, id }) {
    const key = type === 'emoji' ? emojisKey : adjunctsKey;
    await db.sortedSetsRemoveRangeByScore([key], id, id);
}
exports.remove = remove;
//# sourceMappingURL=customizations.js.map