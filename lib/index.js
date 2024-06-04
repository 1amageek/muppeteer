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
exports.getSnapshotsDir = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const browsers_1 = require("@puppeteer/browsers");
const util_1 = require("./util");
const getCacheDir = (options) => {
    const downloadPath = options.downloadPath || os.homedir();
    const cacheDir = path.resolve(downloadPath);
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }
    return cacheDir;
};
const getSnapshotsDir = (options) => {
    const folderName = options.folderName || '.chromium-browser-snapshots';
    const snapshotsDir = path.resolve(options.cacheDir, folderName);
    if (!fs.existsSync(snapshotsDir)) {
        try {
            fs.mkdirSync(snapshotsDir, { recursive: true });
        }
        catch (e) {
            console.error(`Failed to create snapshots dir: ${snapshotsDir}`, e);
        }
    }
    return snapshotsDir;
};
exports.getSnapshotsDir = getSnapshotsDir;
const getBaseUrl = (host) => {
    return `${host}/chromium-browser-snapshots`;
};
const downloadChromium = async (options, baseUrl, revision) => {
    const platform = options.platform || (0, util_1.detectPlatform)();
    const snapshotsDir = (0, exports.getSnapshotsDir)(options);
    const executablePath = (0, util_1.computeExecutablePath)({
        platform,
        buildId: revision,
        cacheDir: snapshotsDir
    });
    if (!fs.existsSync(executablePath)) {
        console.log(`Downloading Chromium revision ${revision} from ${baseUrl}...`);
        try {
            await (0, browsers_1.install)({
                browser: browsers_1.Browser.CHROMIUM,
                cacheDir: snapshotsDir,
                buildId: revision,
                baseUrl: baseUrl
            });
        }
        catch (error) {
            console.error("Failed to download Chromium", error);
            throw error;
        }
    }
    if (!fs.existsSync(executablePath)) {
        throw new Error("Failed to install Chromium");
    }
    return executablePath;
};
const muppeteer = async (options = {}) => {
    const cacheDir = getCacheDir(options);
    options.cacheDir = cacheDir; // Ensure cacheDir is set for later use
    const platform = options.platform || (0, util_1.detectPlatform)();
    const hosts = options.hosts || util_1.defaultHosts;
    // Try to read stats from cache
    const stats = (0, util_1.getStats)(cacheDir);
    if (stats && fs.existsSync(stats.executablePath)) {
        if (!options.revision || (options.revision && options.revision === stats.revision)) {
            console.log(`Using cached Chromium executable at ${stats.executablePath}`);
            return stats.executablePath;
        }
    }
    let revision = options.revision;
    if (!revision) {
        try {
            revision = await (0, browsers_1.resolveBuildId)(browsers_1.Browser.CHROMIUM, platform, 'latest');
        }
        catch (error) {
            console.error("Failed to resolve Chromium revision", error);
            revision = '1138907'; // Known good default revision
        }
    }
    let executablePath;
    for (const host of hosts) {
        const baseUrl = getBaseUrl(host);
        try {
            executablePath = await downloadChromium(options, baseUrl, revision);
            if (executablePath)
                break;
        }
        catch (error) {
            console.warn(`Failed to download from ${baseUrl}: ${error}`);
        }
    }
    if (!executablePath) {
        throw new Error("Failed to download Chromium from all provided hosts");
    }
    // Save stats to cache
    (0, util_1.saveStats)(cacheDir, {
        executablePath,
        revision,
        platform
    });
    console.log(`Chromium executable path: ${executablePath}`);
    return executablePath;
};
exports.default = muppeteer;
//# sourceMappingURL=index.js.map