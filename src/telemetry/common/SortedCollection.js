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
exports.SortedCollection = exports.sortedIndexOf = exports.sortedInsert = void 0;
/**
 * Insert an item into a sorted array using binary search.
 *
 * @type   {T}                item    type
 * @param  {T}                item    to be inserted
 * @param  {Array<T>}         array   to be modified
 * @param  {(a, b) => number} compare function
 *
 * @return {number}                   insertion index
 */
function sortedInsert(item, into, compare) {
    if (into.length === 0) {
        into.push(item);
        return 0;
    }
    var min = 0;
    var max = into.length - 1;
    while (min !== max) {
        var guess = ((min + max) / 2) | 0;
        if (compare(item, into[guess]) < 0) {
            max = Math.max(min, guess - 1);
        }
        else {
            min = Math.min(max, guess + 1);
        }
    }
    var insert = compare(item, into[min]) <= 0 ? min : min + 1;
    into.splice(insert, 0, item);
    return insert;
}
exports.sortedInsert = sortedInsert;
/**
 * Find an index of an element within a sorted array. This should be substantially
 * faster than `indexOf` for large arrays.
 *
 * @type  {T}                item    type
 * @param {T}                item    to find
 * @param {Array<T>}         array   to look through
 * @param {(a, b) => number} compare function
 *
 * @return {number}                  index of the element, `-1` if not found
 */
function sortedIndexOf(item, within, compare) {
    if (within.length === 0) {
        return -1;
    }
    var min = 0;
    var max = within.length - 1;
    while (min !== max) {
        var guess = ((min + max) / 2) | 0;
        var other = within[guess];
        if (item === other) {
            return guess;
        }
        var result = compare(item, other);
        if (result < 0) {
            max = Math.max(min, guess - 1);
        }
        else if (result > 0) {
            min = Math.min(max, guess + 1);
        }
        else {
            // Equal sort value, but different reference, do value search from min
            return within.indexOf(item, min);
        }
    }
    if (item === within[min]) {
        return min;
    }
    return -1;
}
exports.sortedIndexOf = sortedIndexOf;
var SortedCollection = /** @class */ (function () {
    function SortedCollection(compare) {
        // Mapping item `id` to the `Item`, this uses array as a structure with
        // the assumption that `id`s provided are increments from `0`, and that
        // vacant `id`s will be re-used in the future.
        this.map = Array();
        // Actual sorted list of `Item`s.
        this.list = Array();
        // Internal tracker for changes, this number increments whenever the
        // order of the **focused** elements in the collection changes
        this.changeRef = 0;
        // Marks the range of indicies that are focused for tracking.
        // **Note:** `start` is inclusive, while `end` is exclusive (much like
        // `Array.slice()`).
        this.focus = { start: 0, end: 0 };
        this.compare = compare;
    }
    SortedCollection.prototype.setComparator = function (compare) {
        this.compare = compare;
        this.list = this.map.filter(function (item) { return item != null; });
        this.list.sort(compare);
        this.changeRef += 1;
    };
    SortedCollection.prototype.add = function (item) {
        if (this.map.length <= item.id) {
            // Grow map if item.id would be out of scope
            this.map = this.map.concat(Array(Math.max(10, 1 + item.id - this.map.length)));
        }
        // Remove old item if overriding
        this.remove(item.id);
        this.map[item.id] = item;
        var index = sortedInsert(item, this.list, this.compare);
        if (index < this.focus.end) {
            this.changeRef += 1;
        }
    };
    SortedCollection.prototype.remove = function (id) {
        var item = this.map[id];
        if (!item) {
            return;
        }
        var index = sortedIndexOf(item, this.list, this.compare);
        this.list.splice(index, 1);
        this.map[id] = null;
        if (index < this.focus.end) {
            this.changeRef += 1;
        }
    };
    SortedCollection.prototype.get = function (id) {
        return this.map[id];
    };
    SortedCollection.prototype.sorted = function () {
        return this.list;
    };
    SortedCollection.prototype.mut = function (id, mutator) {
        var item = this.map[id];
        if (!item) {
            return;
        }
        var index = sortedIndexOf(item, this.list, this.compare);
        mutator(item);
        if (index >= this.focus.start && index < this.focus.end) {
            this.changeRef += 1;
        }
    };
    SortedCollection.prototype.mutAndSort = function (id, mutator) {
        var item = this.map[id];
        if (!item) {
            return;
        }
        var index = sortedIndexOf(item, this.list, this.compare);
        mutator(item);
        this.list.splice(index, 1);
        var newIndex = sortedInsert(item, this.list, this.compare);
        if (newIndex !== index) {
            var outOfFocus = (index < this.focus.start && newIndex < this.focus.start) ||
                (index >= this.focus.end && newIndex >= this.focus.end);
            if (!outOfFocus) {
                this.changeRef += 1;
            }
        }
    };
    SortedCollection.prototype.mutAndMaybeSort = function (id, mutator, sort) {
        if (sort) {
            this.mutAndSort(id, mutator);
        }
        else {
            this.mut(id, mutator);
        }
    };
    SortedCollection.prototype.mutEach = function (mutator) {
        this.list.forEach(mutator);
    };
    SortedCollection.prototype.mutEachAndSort = function (mutator) {
        this.list.forEach(mutator);
        this.list.sort(this.compare);
        this.changeRef += 1;
    };
    SortedCollection.prototype.clear = function () {
        this.map = [];
        this.list = [];
        this.changeRef += 1;
    };
    // Set a new `Focus`. Any changes to the order of items within the `Focus`
    // will increment `changeRef`.
    SortedCollection.prototype.setFocus = function (start, end) {
        this.focus = { start: start, end: end };
    };
    Object.defineProperty(SortedCollection.prototype, "ref", {
        // Get the reference to current ordering state of focused items.
        get: function () {
            return this.changeRef;
        },
        enumerable: false,
        configurable: true
    });
    // Check if order of focused items has changed since obtaining a `ref`.
    SortedCollection.prototype.hasChangedSince = function (ref) {
        return this.changeRef > ref;
    };
    return SortedCollection;
}());
exports.SortedCollection = SortedCollection;
