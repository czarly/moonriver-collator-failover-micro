"use strict";
// Source code for the Substrate Telemetry Server.
// Copyright (C) 2021 Parity Technologies (UK) Ltd.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.
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
exports.__esModule = true;
exports.Connection = void 0;
var common_1 = require("./common");
var state_1 = require("./state");
var feed_1 = require("./common/feed");
var ws_1 = require("ws");
var rxjs_1 = require("rxjs");
var TIMEOUT_BASE = (1000 * 5); // 5 seconds
var TIMEOUT_MAX = (1000 * 60 * 5); // 5 minutes
var nodes = new common_1.SortedCollection(state_1.Node.compare);
var Connection = /** @class */ (function () {
    function Connection(socket, bindSocketFunction) {
        var _this = this;
        this.socket = socket;
        this.pingId = 0;
        this.pingSent = null;
        this.handleDisconnect = function () { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.clean();
                        this.socket.close();
                        _a = this;
                        return [4 /*yield*/, Connection.socket()];
                    case 1:
                        _a.socket = _b.sent();
                        this.bindSocket();
                        return [2 /*return*/];
                }
            });
        }); };
        this.bindSocket = function (_socket, _handleFeedData, _handleDisconnect) {
            _this.ping();
            _this.socket.addEventListener('message', Connection.handleFeedData);
            _this.socket.addEventListener('close', _this.handleDisconnect);
            _this.socket.addEventListener('error', _this.handleDisconnect);
        };
        this.ping = function () {
            if (_this.pingSent) {
                _this.handleDisconnect();
                return;
            }
            _this.pingId += 1;
            _this.pingSent = (0, common_1.timestamp)();
            _this.socket.send("ping:".concat(_this.pingId));
            _this.pingTimeout = setTimeout(_this.ping, 30000);
        };
        if (bindSocketFunction)
            this.bindSocket = bindSocketFunction;
        this.bindSocket(socket);
    }
    Connection.create = function (nodeBlockInfoSub, socket, binSocketFunction) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                Connection.nodeBlockInfoSubject = nodeBlockInfoSub;
                return [2 /*return*/, new Connection(socket, binSocketFunction)];
            });
        });
    };
    Connection.getAddress = function () {
        return process.env.TELEMETRY_URL || 'wss://telemetry.polkadot.io/feed/';
    };
    Connection.socket = function () {
        return __awaiter(this, void 0, void 0, function () {
            var socket, timeout;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Connection.trySocket()];
                    case 1:
                        socket = _a.sent();
                        timeout = TIMEOUT_BASE;
                        _a.label = 2;
                    case 2:
                        if (!!socket) return [3 /*break*/, 5];
                        return [4 /*yield*/, (0, common_1.sleep)(timeout)];
                    case 3:
                        _a.sent();
                        timeout = Math.min(timeout * 2, TIMEOUT_MAX);
                        return [4 /*yield*/, Connection.trySocket()];
                    case 4:
                        socket = _a.sent();
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, socket];
                }
            });
        });
    };
    Connection.trySocket = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, _) {
                        function clean() {
                            socket.removeEventListener('open', onSuccess);
                            socket.removeEventListener('close', onFailure);
                            socket.removeEventListener('error', onFailure);
                        }
                        function onSuccess() {
                            clean();
                            resolve(socket);
                        }
                        function onFailure() {
                            clean();
                            resolve(null);
                        }
                        var socket = new ws_1["default"](Connection.address);
                        socket.binaryType = 'arraybuffer';
                        socket.addEventListener('open', onSuccess);
                        socket.addEventListener('error', onFailure);
                        socket.addEventListener('close', onFailure);
                    })];
            });
        });
    };
    Connection.prototype.unsubscribeConsensus = function (chain) {
        this.socket.send("no-more-finality:".concat(chain));
    };
    Connection.prototype.clean = function () {
        clearTimeout(this.pingTimeout);
        this.pingSent = null;
        this.socket.removeEventListener('message', Connection.handleFeedData);
        this.socket.removeEventListener('close', this.handleDisconnect);
        this.socket.removeEventListener('error', this.handleDisconnect);
    };
    Connection.nodeBlockInfoSubject = new rxjs_1.Subject();
    Connection.utf8decoder = new TextDecoder('utf-8');
    Connection.address = Connection.getAddress();
    Connection.handleFeedData = function (event) {
        var data;
        if (!event)
            return;
        if (typeof event.data === 'string') {
            data = event.data;
        }
        else {
            var u8aData = new Uint8Array(event.data);
            // Future-proofing for when we switch to binary feed
            if (u8aData[0] === 0x00) {
                // return this.newVersion();
            }
            var str = Connection.utf8decoder.decode(event.data);
            data = str;
        }
        Connection.handleMessages(common_1.FeedMessage.deserialize(data));
    };
    Connection.handleMessages = function (messages) {
        var _loop_1 = function (message) {
            switch (message.action) {
                case feed_1.ACTIONS.FeedVersion: {
                    if (message.payload !== common_1.VERSION) {
                        // return this.newVersion();
                    }
                    break;
                }
                case feed_1.ACTIONS.BestBlock: {
                    var _a = message.payload, best = _a[0], blockTimestamp = _a[1], blockAverage = _a[2];
                    nodes.mutEach(function (node) { return node.newBestBlock(); });
                    // this.appUpdate({ best, blockTimestamp, blockAverage });
                    //console.log('BestBlock: \n\t', best, blockTimestamp, blockAverage)
                    break;
                }
                case feed_1.ACTIONS.BestFinalized: {
                    var finalized = message.payload[0] /*, hash */;
                    // this.appUpdate({ finalized });
                    //console.log('BestFinalized: \n\t', finalized)
                    break;
                }
                case feed_1.ACTIONS.AddedNode: {
                    var _b = message.payload, id = _b[0], nodeDetails = _b[1], nodeStats = _b[2], nodeIO = _b[3], nodeHardware = _b[4], blockDetails = _b[5], location_1 = _b[6], startupTime = _b[7];
                    var node = new state_1.Node(false, id, nodeDetails, nodeStats, nodeIO, nodeHardware, blockDetails, location_1, startupTime);
                    nodes.add(node);
                    /*console.log(
                      'AddedNode: \n\t',
                      {
                        id,
                        nodeDetails,
                        nodeStats,
                        nodeIO,
                        nodeHardware,
                        blockDetails,
                        location,
                        startupTime
                      }
                    );*/
                    Connection.nodeBlockInfoSubject.next({
                        networkID: nodeDetails[4] ? nodeDetails[4] : '',
                        nodeName: nodeDetails[0] ? nodeDetails[0] : '',
                        block: blockDetails[0] ? blockDetails[0] : 0
                    });
                    break;
                }
                case feed_1.ACTIONS.RemovedNode: {
                    var id = message.payload;
                    nodes.remove(id);
                    console.log('RemovedNode: \n\t', id);
                    break;
                }
                case feed_1.ACTIONS.StaleNode: {
                    var id = message.payload;
                    nodes.mutAndSort(id, function (node) { return node.setStale(true); });
                    // console.log('StaleNode: \n\t', id);
                    break;
                }
                case feed_1.ACTIONS.LocatedNode: {
                    var _c = message.payload, id = _c[0], lat_1 = _c[1], lon_1 = _c[2], city_1 = _c[3];
                    nodes.mutAndMaybeSort(id, function (node) { return node.updateLocation([lat_1, lon_1, city_1]); }, false);
                    //console.log('LocatedNode: \n\t', id, lat, lon, city)
                    break;
                }
                case feed_1.ACTIONS.ImportedBlock: {
                    var _d = message.payload, id = _d[0], blockDetails_1 = _d[1];
                    nodes.mutAndSort(id, function (node) { return node.updateBlock(blockDetails_1); });
                    //console.log('ImportedBlock: \n\t', id, blockDetails);
                    break;
                }
                case feed_1.ACTIONS.FinalizedBlock: {
                    var _e = message.payload, id = _e[0], height_1 = _e[1], hash_1 = _e[2];
                    nodes.mutAndMaybeSort(id, function (node) { return node.updateFinalized(height_1, hash_1); }, false);
                    //console.log('FinalizedBlock: \n\t', id, height, hash);
                    break;
                }
                case feed_1.ACTIONS.NodeStats: {
                    var _f = message.payload, id = _f[0], nodeStats_1 = _f[1];
                    nodes.mutAndMaybeSort(id, function (node) { return node.updateStats(nodeStats_1); }, false);
                    //console.log('NodeStats: \n\t', id, nodeStats);
                    break;
                }
                case feed_1.ACTIONS.NodeHardware: {
                    var _g = message.payload, id = _g[0], nodeHardware_1 = _g[1];
                    nodes.mutAndMaybeSort(id, function (node) { return node.updateHardware(nodeHardware_1); }, false);
                    //console.log('NodeHardware: \n\t', id, nodeHardware);
                    break;
                }
                case feed_1.ACTIONS.NodeIO: {
                    var _h = message.payload, id = _h[0], nodeIO_1 = _h[1];
                    nodes.mutAndMaybeSort(id, function (node) { return node.updateIO(nodeIO_1); }, false);
                    //console.log('NodeIO: \n\t', id, nodeIO);
                    break;
                }
                case feed_1.ACTIONS.TimeSync: {
                    //console.log('TimeSync: \n\t', (timestamp() - message.payload) as Types.Milliseconds);
                    break;
                }
                case feed_1.ACTIONS.AddedChain: {
                    var _j = message.payload, label = _j[0], genesisHash = _j[1], nodeCount = _j[2];
                    //console.log('AddedChain: \n\t', label, genesisHash, nodeCount);
                    break;
                }
                case feed_1.ACTIONS.RemovedChain: {
                    // chains.delete(message.payload);
                    // if (this.appState.subscribed === message.payload) {
                    //   nodes.clear();
                    //   this.appUpdate({ subscribed: null, nodes, chains });
                    //   this.resetConsensus();
                    // }
                    //console.log('RemovedChain: \n\t', message.payload);
                    break;
                }
                case feed_1.ACTIONS.SubscribedTo: {
                    // nodes.clear();
                    // this.appUpdate({ subscribed: message.payload, nodes });
                    console.log('SubscribedTo: \n\t', message.payload);
                    break;
                }
                case feed_1.ACTIONS.UnsubscribedFrom: {
                    // if (this.appState.subscribed === message.payload) {
                    //   nodes.clear();
                    //   this.appUpdate({ subscribed: null, nodes });
                    // }
                    console.log('UnsubscribedFrom: \n\t', message.payload);
                    break;
                }
                case feed_1.ACTIONS.Pong: {
                    // this.pong(Number(message.payload));
                    // curius keep alive.
                    break;
                }
                case feed_1.ACTIONS.AfgFinalized: {
                    var _k = message.payload, nodeAddress = _k[0], finalizedNumber = _k[1], finalizedHash = _k[2];
                    var no = parseInt(String(finalizedNumber), 10);
                    // afg.receivedFinalized(nodeAddress, no, finalizedHash);
                    console.log('AfgFinalized: \n\t', nodeAddress, no, finalizedHash);
                    break;
                }
                case feed_1.ACTIONS.AfgReceivedPrevote: {
                    var _l = message.payload, nodeAddress = _l[0], blockNumber = _l[1], blockHash = _l[2], voter = _l[3];
                    var no = parseInt(String(blockNumber), 10);
                    // afg.receivedPre(nodeAddress, no, voter, 'prevote');
                    console.log('AfgReceivedPrevote: \n\t', nodeAddress, no, voter, 'prevote');
                    break;
                }
                case feed_1.ACTIONS.AfgReceivedPrecommit: {
                    var _m = message.payload, nodeAddress = _m[0], blockNumber = _m[1], blockHash = _m[2], voter = _m[3];
                    var no = parseInt(String(blockNumber), 10);
                    // afg.receivedPre(nodeAddress, no, voter, 'precommit');
                    console.log('AfgReceivedPrecommit: \n\t', nodeAddress, no, voter, 'precommit');
                    break;
                }
                case feed_1.ACTIONS.AfgAuthoritySet: {
                    var _o = message.payload, authoritySetId = _o[0], authorities = _o[1];
                    // afg.receivedAuthoritySet(authoritySetId, authorities);
                    console.log('AfgAuthoritySet: \n\t', authoritySetId, authorities);
                    break;
                }
                default: {
                    break;
                }
            }
        };
        for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
            var message = messages_1[_i];
            _loop_1(message);
        }
    };
    return Connection;
}());
exports.Connection = Connection;
