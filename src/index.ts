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
}

const getCacheDir = (options: MuppeteerOptions): string => {
    const downloadPath = options.downloadPath || os.homedir();
    const cacheDir = path.resolve(downloadPath);
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }
    return cacheDir;
};

const muppeteer = async (options: MuppeteerOptions = {}): Promise<string> => {
    const cacheDir = getCacheDir(options);
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
            throw new Error("Failed to resolve Chromium revision");
        }
    }

    const executablePath = computeExecutablePath({
        platform,
        buildId: revision,
        cacheDir
    });

    if (!fs.existsSync(executablePath)) {
        console.log(`Chromium not found. Downloading revision ${revision}...`);
        try {
            await install({
                browser: Browser.CHROMIUM,
                cacheDir: cacheDir,
                buildId: revision,
                baseUrl: hosts[0]
            });
        } catch (error) {
            throw new Error("Failed to download Chromium");
        }
    }

    if (!fs.existsSync(executablePath)) {
        throw new Error("Failed to install Chromium");
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
