import * as path from "path";
import * as http from "http";
import * as https from "https";
import * as os from "os";
import { URL } from "url";
import { BrowserPlatform } from "@puppeteer/browsers";
import * as fs from "fs";

interface ComputeExecutablePathOptions {
    platform: string;
    buildId: string;
    cacheDir: string;
}

export const computeExecutablePath = (options: ComputeExecutablePathOptions): string => {
    const { platform, buildId, cacheDir } = options;
    const executableDir = path.resolve(cacheDir, `.chromium-${buildId}`, platform === "linux" ? "chrome-linux" : "chrome-mac");
    return path.resolve(executableDir, "chrome");
};

export const headRequest = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const urlParsed = new URL(url);
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
