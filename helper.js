"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateShortUUID = generateShortUUID;
var uuid_1 = require("uuid");
function generateShortUUID() {
    return Buffer.from((0, uuid_1.v4)()).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
}
