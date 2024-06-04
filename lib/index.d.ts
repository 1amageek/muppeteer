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
export declare const getSnapshotsDir: (options: MuppeteerOptions) => string;
declare const muppeteer: (options?: MuppeteerOptions) => Promise<string>;
export default muppeteer;
