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
exports.__esModule = true;
exports.Node = exports.comparePinnedChains = exports.PINNED_CHAINS = void 0;
exports.PINNED_CHAINS = {
    // Kusama
    '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe': 2,
    // Polkadot
    '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3': 1
};
function comparePinnedChains(a, b) {
    var aWeight = exports.PINNED_CHAINS[a] || 1024;
    var bWeight = exports.PINNED_CHAINS[b] || 1024;
    return aWeight - bWeight;
}
exports.comparePinnedChains = comparePinnedChains;
var Node = /** @class */ (function () {
    function Node(pinned, id, nodeDetails, nodeStats, nodeIO, nodeHardware, blockDetails, location, startupTime) {
        this.finalized = 0;
        this.finalizedHash = '';
        this._changeRef = 0;
        this.subscriptionsConsensus = new Set();
        var name = nodeDetails[0], implementation = nodeDetails[1], version = nodeDetails[2], validator = nodeDetails[3], networkId = nodeDetails[4];
        this.pinned = pinned;
        this.id = id;
        this.name = name;
        this.implementation = implementation;
        this.version = version;
        this.validator = validator;
        this.networkId = networkId;
        this.startupTime = startupTime;
        var _a = (version || '0.0.0')
            .split('.')
            .map(function (n) { return parseInt(n, 10) | 0; }), _b = _a[0], major = _b === void 0 ? 0 : _b, _c = _a[1], minor = _c === void 0 ? 0 : _c, _d = _a[2], patch = _d === void 0 ? 0 : _d;
        this.sortableName = name.toLocaleLowerCase();
        this.sortableVersion = (major * 1000 + minor * 100 + patch) | 0;
        this.updateStats(nodeStats);
        this.updateIO(nodeIO);
        this.updateHardware(nodeHardware);
        this.updateBlock(blockDetails);
        if (location) {
            this.updateLocation(location);
        }
    }
    Node.compare = function (a, b) {
        if (a.pinned === b.pinned && a.stale === b.stale) {
            if (a.height === b.height) {
                var aPropagation = a.propagationTime == null ? Infinity : a.propagationTime;
                var bPropagation = b.propagationTime == null ? Infinity : b.propagationTime;
                // Ascending sort by propagation time
                return aPropagation - bPropagation;
            }
        }
        else {
            var bSort = (b.pinned ? -2 : 0) + +b.stale;
            var aSort = (a.pinned ? -2 : 0) + +a.stale;
            return aSort - bSort;
        }
        // Descending sort by block number
        return b.height - a.height;
    };
    Node.prototype.updateStats = function (stats) {
        var peers = stats[0], txs = stats[1];
        this.peers = peers;
        this.txs = txs;
        this.trigger();
    };
    Node.prototype.updateIO = function (io) {
        var stateCacheSize = io[0];
        this.stateCacheSize = stateCacheSize;
        this.trigger();
    };
    Node.prototype.updateHardware = function (hardware) {
        var upload = hardware[0], download = hardware[1], chartstamps = hardware[2];
        this.upload = upload;
        this.download = download;
        this.chartstamps = chartstamps;
        this.trigger();
    };
    Node.prototype.updateBlock = function (block) {
        var height = block[0], hash = block[1], blockTime = block[2], blockTimestamp = block[3], propagationTime = block[4];
        this.height = height;
        this.hash = hash;
        this.blockTime = blockTime;
        this.blockTimestamp = blockTimestamp;
        this.propagationTime = propagationTime;
        this.stale = false;
        this.trigger();
    };
    Node.prototype.updateFinalized = function (height, hash) {
        this.finalized = height;
        this.finalizedHash = hash;
    };
    Node.prototype.updateLocation = function (location) {
        var lat = location[0], lon = location[1], city = location[2];
        this.lat = lat;
        this.lon = lon;
        this.city = city;
        this.trigger();
    };
    Node.prototype.newBestBlock = function () {
        if (this.propagationTime != null) {
            this.propagationTime = null;
            this.trigger();
        }
    };
    Node.prototype.setPinned = function (pinned) {
        if (this.pinned !== pinned) {
            this.pinned = pinned;
            this.trigger();
        }
    };
    Node.prototype.setStale = function (stale) {
        if (this.stale !== stale) {
            this.stale = stale;
            this.trigger();
        }
    };
    Object.defineProperty(Node.prototype, "changeRef", {
        get: function () {
            return this._changeRef;
        },
        enumerable: false,
        configurable: true
    });
    Node.prototype.trigger = function () {
        this._changeRef += 1;
    };
    return Node;
}());
exports.Node = Node;
