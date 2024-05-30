# muppeteer

is a lightweight Node.js library designed to manage and download Chromium using Puppeteer. It provides a streamlined interface to ensure you have the correct version of Chromium for your Puppeteer scripts, while also handling caching to avoid redundant downloads.

## Features
- Automatic Chromium management: Automatically downloads the specified or latest version of Chromium if not already available.
- Caching: Uses a local cache to store Chromium binaries, reducing redundant downloads.
- Cross-platform: Supports macOS, Windows, and Linux platforms.
- Customizable: Allows customization of download paths, cache directories, and hosts.

## Installation

```
npm add @1amageek/muppeteer
```

## Usage

Here is a basic example of how to use @1amageek/muppeteer to download and manage Chromium:

```index.ts
  const executablePath = await muppeteer()
  const browser = await puppeteer.launch({
    executablePath: executablePath,
    args: [
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-first-run",
      "--no-sandbox",
      "--no-zygote",
      "--single-process",
    ],
    headless: true,
  });
```

## Options

muppeteer accepts the following options:

- downloadPath (optional): The directory where Chromium will be downloaded. Defaults to the user's home directory.
- cacheDir (optional): The cache directory for storing Chromium binaries. If not specified, defaults to the downloadPath.
- revision (optional): The specific Chromium revision to download. If not specified, the latest revision will be used.
- executablePath (optional): Custom executable path for Chromium. If specified, the library will not attempt to download Chromium.
- platform (optional): The platform to download Chromium for. Automatically detected if not specified.
- hosts (optional): An array of URLs to use for downloading Chromium. Defaults to ['https://storage.googleapis.com'].
