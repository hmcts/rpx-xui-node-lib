"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var joi_1 = __importDefault(require("@hapi/joi"));
function ValidateOpenIdOptions(options) {
    /* eslint-disable @typescript-eslint/camelcase */
    var schema = joi_1.default.object({
        client_id: joi_1.default.string().required(),
        client_secret: joi_1.default.string().required(),
        discovery_endpoint: joi_1.default.string().required(),
        issuer_url: joi_1.default.string().required(),
        logout_url: joi_1.default.string().required(),
        redirect_uri: joi_1.default.string().required(),
        response_types: joi_1.default.array().required().min(1),
        scope: joi_1.default.string().required(),
        sessionKey: joi_1.default.string().required(),
        token_endpoint_auth_method: joi_1.default.string().required(),
        useRoutes: joi_1.default.any(),
    });
    /* eslint-enable @typescript-eslint/camelcase */
    var error = schema.validate(options).error;
    if (error) {
        throw error;
    }
}
exports.ValidateOpenIdOptions = ValidateOpenIdOptions;
