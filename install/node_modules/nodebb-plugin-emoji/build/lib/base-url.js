"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBaseUrl = void 0;
const nconf = require.main.require('nconf');
function getBaseUrl() {
    const relative_path = nconf.get('relative_path') || '';
    const assetBaseUrl = nconf.get('asset_base_url') || `${relative_path}/assets`;
    return assetBaseUrl.startsWith('http') ?
        assetBaseUrl :
        nconf.get('base_url') + assetBaseUrl;
}
exports.getBaseUrl = getBaseUrl;
//# sourceMappingURL=base-url.js.map