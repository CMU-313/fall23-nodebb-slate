'use strict';

const _ = require('lodash');

const meta = require('../meta');
const db = require('../database');
const plugins = require('../plugins');
const user = require('../user');
const topics = require('../topics');
const categories = require('../categories');
const groups = require('../groups');
const utils = require('../utils');

module.exports = function (Posts) {
    /**
     * Creates a new post.
     *
     * @param {Object} data - The post data.
     * @param {number} data.uid - The user ID.
     * @param {number} data.tid - The topic ID.
     * @param {string} data.content - The content of the post.
     * @param {number} [data.timestamp] - The timestamp of the post.
     * @param {boolean} [data.isMain=false] - Whether the post is the main post in a topic.
     * @throws {Error} If the uid is invalid or data.toPid is invalid.
     * @returns {Promise<Object>} The created post object.
     */
    Posts.create = async function (data) {
        // This is an internal method, consider using Topics.reply instead
        const { uid } = data;
        const { tid } = data;
        const content = data.content.toString();
        const timestamp = data.timestamp || Date.now();
        const isMain = data.isMain || false;

         // Assert parameter types
        assert(typeof uid === 'number', 'Parameter "uid" must be a number');
        assert(typeof tid === 'number', 'Parameter "tid" must be a number');
        assert(typeof content === 'string', 'Parameter "content" must be a string');
        assert(typeof timestamp === 'number', 'Parameter "timestamp" must be a number');
        assert(typeof isMain === 'boolean', 'Parameter "isMain" must be a boolean');


        if (!uid && parseInt(uid, 10) !== 0) {
            throw new Error('[[error:invalid-uid]]');
        }

        if (data.toPid && !utils.isNumber(data.toPid)) {
            throw new Error('[[error:invalid-pid]]');
        }

        const pid = await db.incrObjectField('global', 'nextPid');
        let postData = {
            pid: pid,
            uid: uid,
            tid: tid,
            content: content,
            timestamp: timestamp,
        };

        if (data.toPid) {
            postData.toPid = data.toPid;
        }
        if (data.ip && meta.config.trackIpPerPost) {
            postData.ip = data.ip;
        }
        if (data.handle && !parseInt(uid, 10)) {
            postData.handle = data.handle;
        }

        let result = await plugins.hooks.fire('filter:post.create', { post: postData, data: data });
        postData = result.post;
        await db.setObject(`post:${postData.pid}`, postData);

        const topicData = await topics.getTopicFields(tid, ['cid', 'pinned']);
        postData.cid = topicData.cid;

        await Promise.all([
            db.sortedSetAdd('posts:pid', timestamp, postData.pid),
            db.incrObjectField('global', 'postCount'),
            user.onNewPostMade(postData),
            topics.onNewPostMade(postData),
            categories.onNewPostMade(topicData.cid, topicData.pinned, postData),
            groups.onNewPostMade(postData),
            addReplyTo(postData, timestamp),
            Posts.uploads.sync(postData.pid),
        ]);

        result = await plugins.hooks.fire('filter:post.get', { post: postData, uid: data.uid });
        result.post.isMain = isMain;
        plugins.hooks.fire('action:post.save', { post: _.clone(result.post) });
        // Assert return type
        assert(typeof result.post === 'object', 'Return type must be an object');


        return result.post;
    };

    /**
     * Adds a reply to a post.
     *
     * @param {Object} postData - The post data.
     * @param {number} timestamp - The timestamp of the reply.
     */
    async function addReplyTo(postData, timestamp) {
        if (!postData.toPid) {
            return;
        }
        await Promise.all([
            db.sortedSetAdd(`pid:${postData.toPid}:replies`, timestamp, postData.pid),
            db.incrObjectField(`post:${postData.toPid}`, 'replies'),
        ]);
    }
};
