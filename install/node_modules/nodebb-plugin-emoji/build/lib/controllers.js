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
const path_1 = require("path");
const fs_1 = require("fs");
const multer_1 = __importDefault(require("multer"));
const settings = __importStar(require("./settings"));
const pubsub_1 = require("./pubsub");
const customizations = __importStar(require("./customizations"));
const nconf = require.main.require('nconf');
const { setupApiRoute, setupAdminPageRoute } = require.main.require('./src/routes/helpers');
const { formatApiResponse } = require.main.require('./src/controllers/helpers');
// eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires
const version = require(path_1.join(__dirname, '../../package.json')).version;
function controllers({ router, middleware }) {
    const renderAdmin = (req, res, next) => {
        settings.get().then(sets => setImmediate(() => {
            res.render('admin/plugins/emoji', {
                version,
                settings: sets,
            });
        }), err => setImmediate(next, err));
    };
    setupAdminPageRoute(router, '/admin/plugins/emoji', renderAdmin);
    const updateSettings = async (req, res) => {
        const data = req.body;
        await settings.set({
            parseAscii: !!data.parseAscii,
            parseNative: !!data.parseNative,
            customFirst: !!data.customFirst,
        });
        formatApiResponse(200, res);
    };
    setupApiRoute(router, 'put', '/api/v3/admin/plugins/emoji/settings', [middleware.admin.checkPrivileges], updateSettings);
    const buildAssets = async (req, res) => {
        await pubsub_1.build();
        formatApiResponse(200, res);
    };
    setupApiRoute(router, 'put', '/api/v3/admin/plugins/emoji/build', [middleware.admin.checkPrivileges], buildAssets);
    const provideCustomizations = async (req, res) => {
        const data = await customizations.getAll();
        formatApiResponse(200, res, data);
    };
    setupApiRoute(router, 'get', '/api/v3/admin/plugins/emoji/customizations', [middleware.admin.checkPrivileges], provideCustomizations);
    const addCustomization = async (req, res) => {
        const type = req.params.type;
        const item = req.body.item;
        if (!['emoji', 'adjunct'].includes(type)) {
            formatApiResponse(400, res);
            return;
        }
        const id = await customizations.add({ type, item });
        formatApiResponse(200, res, { id });
    };
    setupApiRoute(router, 'post', '/api/v3/admin/plugins/emoji/customizations/:type', [middleware.admin.checkPrivileges], addCustomization);
    const editCustomization = async (req, res) => {
        const id = parseInt(req.params.id, 10);
        const type = req.params.type;
        const item = req.body.item;
        if (!['emoji', 'adjunct'].includes(type)) {
            formatApiResponse(400, res);
            return;
        }
        await customizations.edit({ type, id, item });
        formatApiResponse(200, res);
    };
    setupApiRoute(router, 'put', '/api/v3/admin/plugins/emoji/customizations/:type/:id', [middleware.admin.checkPrivileges], editCustomization);
    const deleteCustomization = async (req, res) => {
        const id = parseInt(req.params.id, 10);
        const type = req.params.type;
        if (!['emoji', 'adjunct'].includes(type)) {
            formatApiResponse(400, res);
            return;
        }
        await customizations.remove({ type, id });
        formatApiResponse(200, res);
    };
    setupApiRoute(router, 'delete', '/api/v3/admin/plugins/emoji/customizations/:type/:id', [middleware.admin.checkPrivileges], deleteCustomization);
    const uploadEmoji = (req, res, next) => {
        if (!req.file) {
            res.sendStatus(400);
            return;
        }
        const fileName = path_1.basename(req.body.fileName);
        fs_1.rename(req.file.path, path_1.join(nconf.get('upload_path'), 'emoji', fileName), (err) => {
            if (err) {
                next(err);
            }
            else {
                res.sendStatus(200);
            }
        });
    };
    const upload = multer_1.default({
        dest: path_1.join(nconf.get('upload_path'), 'emoji'),
    });
    router.post('/api/admin/plugins/emoji/upload', middleware.admin.checkPrivileges, upload.single('emojiImage'), uploadEmoji);
}
exports.default = controllers;
//# sourceMappingURL=controllers.js.map