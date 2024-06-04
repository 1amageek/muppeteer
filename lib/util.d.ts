import { BrowserPlatform } from "@puppeteer/browsers";
interface ComputeExecutablePathOptions {
    platform: string;
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
export {};
