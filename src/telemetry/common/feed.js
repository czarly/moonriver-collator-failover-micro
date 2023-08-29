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
exports.deserialize = exports.serialize = exports.ACTIONS = void 0;
var stringify_1 = require("./stringify");
exports.ACTIONS = {
    FeedVersion: 0x00,
    BestBlock: 0x01,
    BestFinalized: 0x02,
    AddedNode: 0x03,
    RemovedNode: 0x04,
    LocatedNode: 0x05,
    ImportedBlock: 0x06,
    FinalizedBlock: 0x07,
    NodeStats: 0x08,
    NodeHardware: 0x09,
    TimeSync: 0x0a,
    AddedChain: 0x0b,
    RemovedChain: 0x0c,
    SubscribedTo: 0x0d,
    UnsubscribedFrom: 0x0e,
    Pong: 0x0f,
    AfgFinalized: 0x10,
    AfgReceivedPrevote: 0x11,
    AfgReceivedPrecommit: 0x12,
    AfgAuthoritySet: 0x13,
    StaleNode: 0x14,
    NodeIO: 0x15
};
/**
 * Serialize an array of `Message`s to a single JSON string.
 *
 * All messages are squashed into a single array of alternating opcodes and payloads.
 *
 * Action `string`s are converted to opcodes using the `actionToCode` mapping.
 */
function serialize(messages) {
    var squashed = new Array(messages.length * 2);
    var index = 0;
    messages.forEach(function (message) {
        var action = message.action, payload = message.payload;
        squashed[index++] = action;
        squashed[index++] = payload;
    });
    return (0, stringify_1.stringify)(squashed);
}
exports.serialize = serialize;
/**
 * Deserialize data to an array of `Message`s.
 */
function deserialize(data) {
    var json = (0, stringify_1.parse)(data);
    if (!Array.isArray(json) || json.length === 0 || json.length % 2 !== 0) {
        throw new Error('Invalid FeedMessage.Data');
    }
    var messages = new Array(json.length / 2);
    for (var _i = 0, _a = messages.keys(); _i < _a.length; _i++) {
        var index = _a[_i];
        var _b = json.slice(index * 2), action = _b[0], payload = _b[1];
        messages[index] = { action: action, payload: payload };
    }
    return messages;
}
exports.deserialize = deserialize;
