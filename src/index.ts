import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { install, Browser, resolveBuildId, BrowserPlatform } from "@puppeteer/browsers";
import { computeExecutablePath, detectPlatform, defaultHosts, getStats, saveStats } from "./util";

interface MuppeteerOptions {
    downloadPath?: string;
    cacheDir?: string;
    revision?: string;
    executablePath?: string;
    platform?: BrowserPlatform;
    hosts?: string[];
    folderName?: string;
}

const getCacheDir = (options: MuppeteerOptions): string => {
    const downloadPath = options.downloadPath || os.homedir();
    const cacheDir = path.resolve(downloadPath);
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }
    return cacheDir;
};

export const getSnapshotsDir = (options: MuppeteerOptions): string => {
    const folderName = options.folderName || '.chromium-browser-snapshots';
    const snapshotsDir = path.resolve(options.cacheDir!, folderName);
    if (!fs.existsSync(snapshotsDir)) {
        try {
            fs.mkdirSync(snapshotsDir, { recursive: true });
        } catch (e) {
            console.error(`Failed to create snapshots dir: ${snapshotsDir}`, e);
        }
    }
    return snapshotsDir;
};

const getBaseUrl = (host: string) => {
    return `${host}/chromium-browser-snapshots`;
};

const downloadChromium = async (options: MuppeteerOptions, baseUrl: string, revision: string) => {
    const platform = options.platform || detectPlatform();
    const snapshotsDir = getSnapshotsDir(options);
    const executablePath = computeExecutablePath({
        platform,
        buildId: revision,
        cacheDir: snapshotsDir
    });

    if (!fs.existsSync(executablePath)) {
        console.log(`Downloading Chromium revision ${revision} from ${baseUrl}...`);
        try {
            await install({
                browser: Browser.CHROMIUM,
                cacheDir: snapshotsDir,
                buildId: revision,
                baseUrl: baseUrl
            });
        } catch (error) {
            console.error("Failed to download Chromium", error);
            throw error
        }
    }

    if (!fs.existsSync(executablePath)) {
        throw new Error("Failed to install Chromium");
    }

    return executablePath;
};

const muppeteer = async (options: MuppeteerOptions = {}): Promise<string> => {
    const cacheDir = getCacheDir(options);
    options.cacheDir = cacheDir;  // Ensure cacheDir is set for later use
    const platform = options.platform || detectPlatform();
    const hosts = options.hosts || defaultHosts;

    // Try to read stats from cache
    const stats = getStats(cacheDir);
    if (stats && fs.existsSync(stats.executablePath)) {
        if (!options.revision || (options.revision && options.revision === stats.revision)) {
            console.log(`Using cached Chromium executable at ${stats.executablePath}`);
            return stats.executablePath;
        }
    }

    let revision = options.revision;
    if (!revision) {
        try {
            revision = await resolveBuildId(Browser.CHROMIUM, platform, 'latest');
        } catch (error) {
            console.error("Failed to resolve Chromium revision", error);
            revision = '1138907';  // Known good default revision
        }
    }

    let executablePath: string | undefined;
    for (const host of hosts) {
        const baseUrl = getBaseUrl(host);
        try {
            executablePath = await downloadChromium(options, baseUrl, revision);
            if (executablePath) break;
        } catch (error) {
            console.warn(`Failed to download from ${baseUrl}: ${error}`);
        }
    }

    if (!executablePath) {
        throw new Error("Failed to download Chromium from all provided hosts");
    }

    // Save stats to cache
    saveStats(cacheDir, {
        executablePath,
        revision,
        platform
    });

    console.log(`Chromium executable path: ${executablePath}`);
    return executablePath;
};

export default muppeteer;
