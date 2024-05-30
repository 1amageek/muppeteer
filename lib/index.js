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
const muppeteer = async (options = {}) => {
    const cacheDir = getCacheDir(options);
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
            throw new Error("Failed to resolve Chromium revision");
        }
    }
    const executablePath = (0, util_1.computeExecutablePath)({
        platform,
        buildId: revision,
        cacheDir
    });
    if (!fs.existsSync(executablePath)) {
        console.log(`Chromium not found. Downloading revision ${revision}...`);
        try {
            await (0, browsers_1.install)({
                browser: browsers_1.Browser.CHROMIUM,
                cacheDir: cacheDir,
                buildId: revision,
                baseUrl: hosts[0]
            });
        }
        catch (error) {
            throw new Error("Failed to download Chromium");
        }
    }
    if (!fs.existsSync(executablePath)) {
        throw new Error("Failed to install Chromium");
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