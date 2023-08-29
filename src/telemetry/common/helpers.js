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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.NumStats = exports.noop = exports.timestamp = exports.sleep = exports.PhantomData = void 0;
/**
 * PhantomData akin to Rust, because sometimes you need to be smarter than
 * the compiler.
 */
var PhantomData = /** @class */ (function () {
    function PhantomData() {
    }
    return PhantomData;
}());
exports.PhantomData = PhantomData;
/**
 * Asynchronous sleep
 */
function sleep(time) {
    return new Promise(function (resolve, _reject) {
        setTimeout(function () { return resolve(); }, time);
    });
}
exports.sleep = sleep;
exports.timestamp = Date.now;
function noop() { }
exports.noop = noop;
/**
 * Keep track of last N numbers pushed onto internal stack.
 * Provides means to get an average of said numbers.
 */
var NumStats = /** @class */ (function () {
    function NumStats(history) {
        this.index = 0;
        if (history < 1) {
            throw new Error('Must track at least one number');
        }
        this.history = history;
        this.stack = new Array(history);
    }
    NumStats.prototype.push = function (val) {
        this.stack[this.index++ % this.history] = val;
    };
    /**
     * Get average value of all values on the stack.
     *
     * @return {T} average value
     */
    NumStats.prototype.average = function () {
        if (this.index === 0) {
            return 0;
        }
        var list = this.nonEmpty();
        var sum = 0;
        for (var _i = 0, _a = list; _i < _a.length; _i++) {
            var n = _a[_i];
            sum += n;
        }
        return (sum / list.length);
    };
    /**
     * Get average value of all values of the stack after filtering
     * out a number of highest and lowest values
     *
     * @param  {number} extremes number of high/low values to ignore
     * @return {T}               average value
     */
    NumStats.prototype.averageWithoutExtremes = function (extremes) {
        if (this.index === 0) {
            return 0;
        }
        var list = this.nonEmpty();
        var count = list.length - extremes * 2;
        if (count < 1) {
            // Not enough entries to remove desired number of extremes,
            // fall back to regular average
            return this.average();
        }
        var sum = 0;
        for (var _i = 0, _a = __spreadArray([], list, true).sort(function (a, b) { return a - b; })
            .slice(extremes, -extremes); _i < _a.length; _i++) {
            var n = _a[_i];
            sum += n;
        }
        return (sum / count);
    };
    NumStats.prototype.nonEmpty = function () {
        return this.index < this.history
            ? this.stack.slice(0, this.index)
            : this.stack;
    };
    return NumStats;
}());
exports.NumStats = NumStats;
