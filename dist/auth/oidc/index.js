"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var openid_client_1 = require("openid-client");
var express = __importStar(require("express"));
var events = __importStar(require("events"));
var passport_1 = __importDefault(require("passport"));
var oidc_constants_1 = require("./oidc.constants");
var url_1 = require("url");
var http_1 = require("../../http/http");
var openIdOptions_validation_1 = require("./validation/openIdOptions.validation");
var jwt_decode_1 = __importDefault(require("jwt-decode"));
//TODO: move this as an option and proper logger
var logger = console;
var OpenID = /** @class */ (function (_super) {
    __extends(OpenID, _super);
    /* eslint-enable @typescript-eslint/camelcase */
    function OpenID() {
        var _this = _super.call(this) || this;
        _this.router = express.Router({ mergeParams: true });
        /* eslint-disable @typescript-eslint/camelcase */
        _this.options = {
            client_id: '',
            discovery_endpoint: '',
            issuer_url: '',
            redirect_uri: '',
            scope: '',
            logout_url: '',
            useRoutes: true,
        };
        _this.verify = function (tokenset, userinfo, done) {
            /*if (!propsExist(userinfo, ['roles'])) {
                logger.warn('User does not have any access roles.')
                return done(null, false, {message: 'User does not have any access roles.'})
            }*/
            logger.info('verify okay, user:', userinfo);
            return done(null, { tokenset: tokenset, userinfo: userinfo });
        };
        _this.initialiseStrategy = function (options) { return __awaiter(_this, void 0, void 0, function () {
            var redirectUri, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        redirectUri = new url_1.URL(oidc_constants_1.AUTH.ROUTE.OAUTH_CALLBACK, options.redirect_uri);
                        _a = this;
                        return [4 /*yield*/, this.discover()];
                    case 1:
                        _a.issuer = _b.sent();
                        this.client = new this.issuer.Client(options);
                        passport_1.default.use(oidc_constants_1.OIDC.STRATEGY_NAME, new openid_client_1.Strategy({
                            client: this.client,
                            params: {
                                prompt: oidc_constants_1.OIDC.PROMPT,
                                // eslint-disable-next-line @typescript-eslint/camelcase
                                redirect_uri: redirectUri.toString(),
                                scope: options.scope,
                            },
                            sessionKey: options.sessionKey,
                        }, this.verify));
                        return [2 /*return*/];
                }
            });
        }); };
        _this.configure = function (options) {
            _this.options = options;
            openIdOptions_validation_1.ValidateOpenIdOptions(options);
            passport_1.default.serializeUser(function (user, done) {
                if (!_this.listenerCount(oidc_constants_1.AUTH.EVENT.SERIALIZE_USER)) {
                    done(null, user);
                }
                else {
                    _this.emit(oidc_constants_1.AUTH.EVENT.SERIALIZE_USER, user, done);
                }
            });
            passport_1.default.deserializeUser(function (id, done) {
                if (!_this.listenerCount(oidc_constants_1.AUTH.EVENT.DESERIALIZE_USER)) {
                    done(null, id);
                }
                else {
                    _this.emit(oidc_constants_1.AUTH.EVENT.DESERIALIZE_USER, id, done);
                }
            });
            (function () { return __awaiter(_this, void 0, void 0, function () {
                var err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.initialiseStrategy(this.options)];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            err_1 = _a.sent();
                            // next(err)
                            logger.error(err_1);
                            this.emit('oidc.configure.error', err_1);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); })();
            _this.router.use(passport_1.default.initialize());
            _this.router.use(passport_1.default.session());
            if (options.useRoutes) {
                _this.router.get(oidc_constants_1.AUTH.ROUTE.DEFAULT_AUTH_ROUTE, function (req, res) {
                    res.send(req.isAuthenticated());
                });
                _this.router.get(oidc_constants_1.AUTH.ROUTE.LOGIN, _this.loginHandler);
                _this.router.get(oidc_constants_1.AUTH.ROUTE.OAUTH_CALLBACK, _this.callbackHandler);
                _this.router.get(oidc_constants_1.AUTH.ROUTE.LOGOUT, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.logout(req, res)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
            }
            _this.emit('oidc.bootstrap.success');
            return _this.router;
        };
        _this.logout = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var accessToken, refreshToken, auth, e_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        logger.log('logout start');
                        accessToken = (_a = req.session) === null || _a === void 0 ? void 0 : _a.passport.user.tokenset.access_token;
                        refreshToken = (_b = req.session) === null || _b === void 0 ? void 0 : _b.passport.user.tokenset.refresh_token;
                        auth = "Basic " + Buffer.from(this.options.client_id + ":" + this.options.client_secret).toString('base64');
                        return [4 /*yield*/, http_1.http.delete(this.options.logout_url + "/session/" + accessToken, {
                                headers: {
                                    Authorization: auth,
                                },
                            })];
                    case 1:
                        _c.sent();
                        return [4 /*yield*/, http_1.http.delete(this.options.logout_url + "/session/" + refreshToken, {
                                headers: {
                                    Authorization: auth,
                                },
                            })
                            //passport provides this method on request object
                        ];
                    case 2:
                        _c.sent();
                        //passport provides this method on request object
                        req.logout();
                        if (!req.query.noredirect && req.query.redirect) {
                            // 401 is when no accessToken
                            res.redirect(401, oidc_constants_1.AUTH.ROUTE.DEFAULT_REDIRECT);
                        }
                        else {
                            res.redirect(oidc_constants_1.AUTH.ROUTE.DEFAULT_REDIRECT);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _c.sent();
                        res.redirect(401, oidc_constants_1.AUTH.ROUTE.DEFAULT_REDIRECT);
                        return [3 /*break*/, 4];
                    case 4:
                        logger.log('logout end');
                        return [2 /*return*/];
                }
            });
        }); };
        _this.callbackHandler = function (req, res, next) {
            passport_1.default.authenticate(oidc_constants_1.OIDC.STRATEGY_NAME, function (error, user, info) {
                // TODO: give a more meaningful error to user rather than redirect back to idam
                // return next(error) would pass off to error.handler.ts to show users a proper error page etc
                if (error) {
                    logger.error(error);
                    return next(error);
                }
                if (info) {
                    logger.info(info);
                    // return next(info)
                }
                if (!user) {
                    logger.info('No user found, redirecting');
                    return res.redirect(oidc_constants_1.AUTH.ROUTE.LOGIN);
                }
                req.logIn(user, function (err) {
                    if (err) {
                        return next(err);
                    }
                    if (!_this.listenerCount(oidc_constants_1.OIDC.EVENT.AUTHENTICATE_SUCCESS)) {
                        logger.log("redirecting, no listener count: " + oidc_constants_1.OIDC.EVENT.AUTHENTICATE_SUCCESS, req.session);
                        res.redirect(oidc_constants_1.AUTH.ROUTE.DEFAULT_REDIRECT);
                    }
                    else {
                        _this.emit(oidc_constants_1.OIDC.EVENT.AUTHENTICATE_SUCCESS, false, req, res, next);
                    }
                });
            })(req, res, next);
        };
        _this.discover = function () { return __awaiter(_this, void 0, void 0, function () {
            var issuer, metadata;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger.log("discovering endpoint: " + this.options.discovery_endpoint);
                        return [4 /*yield*/, openid_client_1.Issuer.discover("" + this.options.discovery_endpoint)];
                    case 1:
                        issuer = _a.sent();
                        metadata = issuer.metadata;
                        metadata.issuer = this.options.issuer_url;
                        logger.log('metadata', metadata);
                        return [2 /*return*/, new openid_client_1.Issuer(metadata)];
                }
            });
        }); };
        _this.loginHandler = function (req, res, next) {
            return passport_1.default.authenticate(oidc_constants_1.OIDC.STRATEGY_NAME)(req, res, next);
        };
        _this.isTokenExpired = function (token) {
            var jwtData = jwt_decode_1.default(token);
            var expires = new Date(jwtData.exp * 1000).getTime();
            var now = new Date().getTime();
            return expires < now;
        };
        _this.authenticate = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userDetails, currentAccessToken, _a, e_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (req.isUnauthenticated()) {
                            logger.log('unauthenticated, redirecting');
                            return [2 /*return*/, res.redirect(oidc_constants_1.AUTH.ROUTE.LOGIN)];
                        }
                        if (!(req.session && this.client)) return [3 /*break*/, 6];
                        userDetails = req.session.passport.user;
                        currentAccessToken = userDetails.tokenset.access_token;
                        req.headers['user-roles'] = userDetails.userinfo.roles.join();
                        if (!currentAccessToken) return [3 /*break*/, 6];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
                        if (!this.isTokenExpired(currentAccessToken)) return [3 /*break*/, 3];
                        logger.log('token expired');
                        _a = req.session.passport.user;
                        return [4 /*yield*/, this.client.refresh(req.session.passport.user.tokenset.refresh_token, req.session.passport.user.tokenset)];
                    case 2:
                        _a.tokenset = _b.sent();
                        req.headers.Authorization = "Bearer " + req.session.passport.user.tokenset.access_token;
                        if (!this.listenerCount(oidc_constants_1.OIDC.EVENT.AUTHENTICATE_SUCCESS)) {
                            logger.log("refresh: no listener count: " + oidc_constants_1.OIDC.EVENT.AUTHENTICATE_SUCCESS);
                            return [2 /*return*/, next()];
                        }
                        else {
                            this.emit(oidc_constants_1.OIDC.EVENT.AUTHENTICATE_SUCCESS, true, req, res, next);
                            return [2 /*return*/];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        req.headers.Authorization = "Bearer " + req.session.passport.user.tokenset.access_token;
                        return [2 /*return*/, next()];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        e_2 = _b.sent();
                        logger.log('refresh error =>', e_2);
                        next(e_2);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/, res.redirect(oidc_constants_1.AUTH.ROUTE.LOGIN)];
                }
            });
        }); };
        return _this;
    }
    return OpenID;
}(events.EventEmitter));
exports.OpenID = OpenID;
exports.default = new OpenID();
