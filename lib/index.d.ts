import { BrowserPlatform } from "@puppeteer/browsers";
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
export declare const computeExecutablePath: (options: ComputeExecutablePathOptions) => string;
export declare const detectPlatform: () => BrowserPlatform;
export declare const defaultHosts: string[];
interface Stats {
    executablePath: string;
    revision: string;
    platform: BrowserPlatform;
}
export declare const getStats: (cacheDir: string) => Stats | null;
export declare const saveStats: (cacheDir: string, stats: Stats) => void;
export declare const getSnapshotsDir: (options: MuppeteerOptions) => string;
declare const muppeteer: (options?: MuppeteerOptions) => Promise<string>;
export default muppeteer;
