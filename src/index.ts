import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { install, Browser, resolveBuildId, BrowserPlatform } from "@puppeteer/browsers";

interface MuppeteerOptions {
    downloadPath?: string;
    cacheDir?: string;
    revision?: string;
    executablePath?: string;
    platform?: BrowserPlatform;
    hosts?: string[];
    folderName?: string;
}

interface ComputeExecutablePathOptions {
    platform: BrowserPlatform;
    buildId: string;
    cacheDir: string;
}

export const computeExecutablePath = (options: ComputeExecutablePathOptions): string => {
    const { platform, buildId, cacheDir } = options;
    const executableDir = path.resolve(cacheDir, `.chromium-${buildId}`, platform === BrowserPlatform.LINUX ? "chrome-linux" : "chrome-mac");
    return path.resolve(executableDir, "chrome");
};

export const detectPlatform = (): BrowserPlatform => {
    const platform = os.platform();
    const arch = os.arch();

    if (platform === "darwin") {
        return arch === "arm64" ? BrowserPlatform.MAC_ARM : BrowserPlatform.MAC;
    } else if (platform === "win32") {
        return arch === "x64" ? BrowserPlatform.WIN64 : BrowserPlatform.WIN32;
    } else if (platform === "linux") {
        return BrowserPlatform.LINUX;
    } else {
        throw new Error(`Unsupported platform: ${platform}`);
    }
};

export const defaultHosts = ["https://storage.googleapis.com"];

interface Stats {
    executablePath: string;
    revision: string;
    platform: BrowserPlatform;
}

const STATS_FILE = ".pcr-stats.json";

export const getStats = (cacheDir: string): Stats | null => {
    const statsPath = path.resolve(cacheDir, STATS_FILE);
    if (fs.existsSync(statsPath)) {
        try {
            return JSON.parse(fs.readFileSync(statsPath, "utf-8")) as Stats;
        } catch (error) {
            console.error("Failed to read stats from cache", error);
        }
    }
    return null;
};

export const saveStats = (cacheDir: string, stats: Stats): void => {
    const statsPath = path.resolve(cacheDir, STATS_FILE);
    try {
        fs.writeFileSync(statsPath, JSON.stringify(stats, null, 4));
    } catch (error) {
        console.error("Failed to save stats to cache", error);
    }
};

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

const getBaseUrl = (host: string): string => {
    return `${host}/chromium-browser-snapshots`;
};

const getDownloadUrl = (platform: BrowserPlatform, buildId: string, baseUrl: string): string => {
    const folderName = platform === BrowserPlatform.LINUX ? "Linux_x64" :
                       platform === BrowserPlatform.MAC_ARM ? "Mac_Arm" : 
                       platform === BrowserPlatform.MAC ? "Mac" :
                       platform === BrowserPlatform.WIN32 ? "Win" : 
                       platform === BrowserPlatform.WIN64 ? "Win_x64" : "";
                       
    const archiveName = platform === BrowserPlatform.LINUX ? "chrome-linux" :
                        platform === BrowserPlatform.MAC_ARM || platform === BrowserPlatform.MAC ? "chrome-mac" :
                        parseInt(buildId, 10) > 591479 ? "chrome-win" : "chrome-win32";

    return `${baseUrl}/${folderName}/${buildId}/${archiveName}.zip`;
};

const downloadChromium = async (options: MuppeteerOptions, baseUrl: string, revision: string): Promise<string> => {
    const platform = options.platform || detectPlatform();
    const downloadUrl = getDownloadUrl(platform, revision, baseUrl);
    
    console.log(`Downloading Chromium from ${downloadUrl}...`);
    const snapshotsDir = getSnapshotsDir(options);
    const executablePath = computeExecutablePath({
        platform,
        buildId: revision,
        cacheDir: snapshotsDir
    });

    if (!fs.existsSync(executablePath)) {
        try {
            await install({
                browser: Browser.CHROMIUM,
                cacheDir: snapshotsDir,
                buildId: revision,
                baseUrl: baseUrl
            });
        } catch (error) {
            console.error("Failed to download Chromium", error);
            throw error;
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
        throw new Error(`Failed to download Chromium from all provided hosts`);
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