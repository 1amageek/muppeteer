"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveStats = exports.getStats = exports.defaultHosts = exports.detectPlatform = exports.headRequest = exports.computeExecutablePath = void 0;
const path = __importStar(require("path"));
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const os = __importStar(require("os"));
const url_1 = require("url");
const browsers_1 = require("@puppeteer/browsers");
const fs = __importStar(require("fs"));
const computeExecutablePath = (options) => {
    const { platform, buildId, cacheDir } = options;
    const executableDir = path.resolve(cacheDir, `.chromium-${buildId}`, platform === "linux" ? "chrome-linux" : "chrome-mac");
    return path.resolve(executableDir, "chrome");
};
exports.computeExecutablePath = computeExecutablePath;
const headRequest = (url) => {
    return new Promise((resolve) => {
        const urlParsed = new url_1.URL(url);
        const isHttps = urlParsed.protocol === "https:";
        const options = {
            method: "HEAD",
            hostname: urlParsed.hostname,
            path: urlParsed.pathname + urlParsed.search,
        };
        const request = isHttps ? https.request(options) : http.request(options);
        request.setTimeout(3000);
        request.end();
        request.on("response", (res) => {
            resolve(res.statusCode === 200);
        });
        request.on("error", () => resolve(false));
        request.on("timeout", () => resolve(false));
    });
};
exports.headRequest = headRequest;
const detectPlatform = () => {
    const platform = os.platform();
    const arch = os.arch();
    if (platform === "darwin") {
        return arch === "arm64" ? browsers_1.BrowserPlatform.MAC_ARM : browsers_1.BrowserPlatform.MAC;
    }
    else if (platform === "win32") {
        return arch === "x64" ? browsers_1.BrowserPlatform.WIN64 : browsers_1.BrowserPlatform.WIN32;
    }
    else if (platform === "linux") {
        return browsers_1.BrowserPlatform.LINUX;
    }
    else {
        throw new Error(`Unsupported platform: ${platform}`);
    }
};
exports.detectPlatform = detectPlatform;
exports.defaultHosts = ["https://storage.googleapis.com"];
const STATS_FILE = ".pcr-stats.json";
const getStats = (cacheDir) => {
    const statsPath = path.resolve(cacheDir, STATS_FILE);
    if (fs.existsSync(statsPath)) {
        try {
            return JSON.parse(fs.readFileSync(statsPath, "utf-8"));
        }
        catch (error) {
            console.error("Failed to read stats from cache", error);
        }
    }
    return null;
};
exports.getStats = getStats;
const saveStats = (cacheDir, stats) => {
    const statsPath = path.resolve(cacheDir, STATS_FILE);
    try {
        fs.writeFileSync(statsPath, JSON.stringify(stats, null, 4));
    }
    catch (error) {
        console.error("Failed to save stats to cache", error);
    }
};
exports.saveStats = saveStats;
//# sourceMappingURL=util.js.map