"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var hash = __importStar(require("hash.js"));
var bytes_1 = require("../utils/bytes");
var errors = __importStar(require("../utils/errors"));
var supportedAlgorithms = { sha256: true, sha512: true };
function computeHmac(algorithm, key, data) {
    if (!supportedAlgorithms[algorithm]) {
        errors.throwError('unsupported algorithm ' + algorithm, errors.UNSUPPORTED_OPERATION, { operation: 'hmac', algorithm: algorithm });
    }
    return bytes_1.arrayify(hash.hmac(hash[algorithm], bytes_1.arrayify(key)).update(bytes_1.arrayify(data)).digest());
}
exports.computeHmac = computeHmac;
