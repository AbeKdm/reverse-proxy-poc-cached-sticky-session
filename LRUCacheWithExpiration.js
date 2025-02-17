"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LRUCacheWithExpiration = void 0;
var logger_1 = require("./logger");
var Mutex = /** @class */ (function () {
    function Mutex() {
        this.queue = [];
        this.locked = false;
    }
    // Locks the mutex until released
    Mutex.prototype.lock = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.locked) return [3 /*break*/, 2];
                        return [4 /*yield*/, new Promise(function (resolve) { return _this.queue.push(resolve); })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.locked = true;
                        return [2 /*return*/];
                }
            });
        });
    };
    // Releases the lock and runs the next function in the queue
    Mutex.prototype.release = function () {
        if (!this.locked) {
            throw new Error("Mutex is not locked");
        }
        this.locked = false;
        if (this.queue.length > 0) {
            var nextResolve = this.queue.shift();
            if (nextResolve)
                nextResolve();
        }
    };
    return Mutex;
}());
var LRUCacheWithExpiration = /** @class */ (function () {
    function LRUCacheWithExpiration(maxSize, expirationTime) {
        if (expirationTime === void 0) { expirationTime = 2 * 60 * 1000; }
        var _this = this;
        this.logger = (0, logger_1.getLogger)('CACHE');
        this.cache = new Map();
        this.maxSize = maxSize;
        this.expirationTime = expirationTime;
        this.mutex = new Mutex();
        // Automatically clean expired entries every 5 minutes
        // this.cleanupInterval = setInterval(() => this.clearExpired(), 5 * 60 * 1000);
        // Automatically write to the logs all cache entries every 1 minute
        setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // add lock to prevent 
                    return [4 /*yield*/, this.mutex.lock()];
                    case 1:
                        // add lock to prevent 
                        _a.sent();
                        try {
                            this.cache.forEach(function (entry, key) {
                                _this.logger.trace("Key: ".concat(key, ", URL: ").concat(entry.url, ", Last Accessed: ").concat(entry.lastAccessed));
                            });
                        }
                        finally {
                            this.mutex.release();
                        }
                        return [2 /*return*/];
                }
            });
        }); }, 60 * 1000);
    }
    // Method to get an item from the cache (thread-safe)
    LRUCacheWithExpiration.prototype.get = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var currentTime, cacheEntry;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mutex.lock()];
                    case 1:
                        _a.sent(); // Ensure thread-safety for this operation
                        try {
                            currentTime = Date.now();
                            cacheEntry = this.cache.get(key);
                            if (cacheEntry) {
                                // Check if the cache entry is expired
                                if (currentTime - cacheEntry.lastAccessed > this.expirationTime) {
                                    this.cache.delete(key); // Evict the expired item
                                    return [2 /*return*/, null];
                                }
                                // Update the last accessed time
                                cacheEntry.lastAccessed = currentTime;
                                // Move the accessed item to the front to mark it as recently used
                                this.cache.delete(key); // Remove from map
                                this.cache.set(key, cacheEntry); // Add to the end
                                return [2 /*return*/, cacheEntry.url];
                            }
                            return [2 /*return*/, null];
                        }
                        finally {
                            this.mutex.release(); // Release the lock
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    // Method to set an item in the cache (thread-safe)
    LRUCacheWithExpiration.prototype.set = function (key, url) {
        return __awaiter(this, void 0, void 0, function () {
            var currentTime, leastRecentlyUsedKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mutex.lock()];
                    case 1:
                        _a.sent(); // Ensure thread-safety for this operation
                        try {
                            currentTime = Date.now();
                            // If the cache is full, evict the least recently used (LRU) item
                            if (this.cache.size >= this.maxSize) {
                                leastRecentlyUsedKey = this.cache.keys().next().value;
                                this.cache.delete(leastRecentlyUsedKey); // Evict the LRU item
                            }
                            // Add the new entry to the cache
                            this.cache.set(key, { key: key, url: url, lastAccessed: currentTime });
                        }
                        finally {
                            this.mutex.release(); // Release the lock
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    // Optional: Method to clear expired items periodically (thread-safe)
    LRUCacheWithExpiration.prototype.clearExpired = function () {
        return __awaiter(this, void 0, void 0, function () {
            var currentTime_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mutex.lock()];
                    case 1:
                        _a.sent(); // Ensure thread-safety for this operation
                        try {
                            currentTime_1 = Date.now();
                            this.cache.forEach(function (entry, key) {
                                if (currentTime_1 - entry.lastAccessed > _this.expirationTime) {
                                    _this.cache.delete(key); // Evict expired item
                                }
                            });
                        }
                        finally {
                            this.mutex.release(); // Release the lock
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    // Optional: Method to get the current cache size
    LRUCacheWithExpiration.prototype.size = function () {
        return this.cache.size;
    };
    LRUCacheWithExpiration.prototype.stopAutoCleanup = function () {
        clearInterval(this.cleanupInterval);
    };
    return LRUCacheWithExpiration;
}());
exports.LRUCacheWithExpiration = LRUCacheWithExpiration;
