import type { Config } from "testplane";
import _ from "lodash";
import { STORYBOOK_KNOWN_PATH_ENDINGS, STORYBOOK_SET_NAME } from "./constants";
import {
    getStorybookPathEndingWith,
    getDefaultBrowserIds,
    patchTestplaneSets,
    disableTestplaneIsolation,
    patchTestplaneBaseUrl,
    patchSystemExtensions,
} from "./utils";

describe("utils", () => {
    const getConfig_ = (config: Record<string, unknown>): Config => {
        const testplaneConfig = config as unknown as Config;

        testplaneConfig.getBrowserIds = function () {
            return Object.keys(this.browsers);
        };

        testplaneConfig.forBrowser = function (browserId: string) {
            return this.browsers[browserId];
        };

        return testplaneConfig;
    };

    describe("getStorybookPathEndingWith", () => {
        it("should return a URL with the specified path ending", () => {
            const url = "http://localhost:6006/?path=/story/button--default";
            const pathEnding = "new-ending";
            const expectedUrl = "http://localhost:6006/new-ending?path=/story/button--default";

            expect(getStorybookPathEndingWith(url, pathEnding)).toBe(expectedUrl);
        });

        it("should trim existing known storybook path endings", () => {
            const url = "http://localhost:6006/";
            const pathEnding = "iframe.html";
            const expectedUrl = "http://localhost:6006/iframe.html";

            STORYBOOK_KNOWN_PATH_ENDINGS.forEach(ending => {
                const urlWithEnding = _.trimEnd(url, "/") + `/${ending}`;
                expect(getStorybookPathEndingWith(urlWithEnding, pathEnding)).toBe(expectedUrl);
            });
        });

        it("should not trim unknown path endings", () => {
            const url = "http://localhost:6006/unknown-ending";
            const pathEnding = "new-ending";
            const expectedUrl = "http://localhost:6006/unknown-ending/new-ending";

            expect(getStorybookPathEndingWith(url, pathEnding)).toBe(expectedUrl);
        });
    });

    describe("patchSystemExtensions", () => {
        it("should add .js, if it is not present in system.fileExtensions", () => {
            const config = getConfig_({
                system: {
                    fileExtensions: [".ts"],
                },
            });

            patchSystemExtensions(config);

            expect(config.system.fileExtensions).toEqual([".ts", ".js"]);
        });

        it("should not .js, if it is already present in system.fileExtensions", () => {
            const config = getConfig_({
                system: {
                    fileExtensions: [".js", ".mjs"],
                },
            });

            patchSystemExtensions(config);

            expect(config.system.fileExtensions).toEqual([".js", ".mjs"]);
        });
    });

    describe("getDefaultBrowserIds", () => {
        const config = getConfig_({
            browsers: {
                chrome: {},
                firefox: {},
                "firefox-mobile": {},
            },
        });

        it("should not limit browsers for an empty plugin default", () => {
            expect(getDefaultBrowserIds(config, [])).toBeNull();
        });

        it("should resolve string and regexp defaults against configured browsers", () => {
            expect(getDefaultBrowserIds(config, ["chrome", /^firefox/])).toEqual([
                "chrome",
                "firefox",
                "firefox-mobile",
            ]);
        });

        it("should ignore defaults that are absent from Testplane configuration", () => {
            expect(getDefaultBrowserIds(config, ["safari"])).toEqual([]);
        });
    });

    describe("patchTestplaneSets", () => {
        it("should create a new set with all configured browsers and specified files", () => {
            const config = getConfig_({
                browsers: {
                    chrome: {},
                    firefox: {},
                },
                sets: {},
            });
            const files = ["file1", "file2"];

            patchTestplaneSets(config, { files });

            expect(config.sets).toEqual({
                [STORYBOOK_SET_NAME]: {
                    browsers: ["chrome", "firefox"],
                    files: ["file1", "file2"],
                },
            });
        });

        it("should overwrite sets completely by default", () => {
            const config = getConfig_({
                browsers: {
                    chrome: {},
                    firefox: {},
                },
                sets: { "my-storybook-set": { files: ["my-files"], browsers: ["my-browsers"] } },
            });
            const files = ["file1", "file2"];

            patchTestplaneSets(config, { files });

            expect(config.sets).toEqual({
                [STORYBOOK_SET_NAME]: {
                    browsers: ["chrome", "firefox"],
                    files: ["file1", "file2"],
                },
            });
        });

        it("should not overwrite sets completely with 'unsafeAllowOtherTests'", () => {
            const config = getConfig_({
                browsers: {
                    chrome: {},
                    firefox: {},
                },
                sets: { "my-storybook-set": { files: ["my-files"], browsers: ["my-browsers"] } },
            });
            const files = ["file1", "file2"];

            patchTestplaneSets(config, { files, unsafeAllowOtherTests: true });

            expect(config.sets).toEqual({
                [STORYBOOK_SET_NAME]: {
                    browsers: ["chrome", "firefox"],
                    files: ["file1", "file2"],
                },
                "my-storybook-set": {
                    browsers: ["my-browsers"],
                    files: ["my-files"],
                },
            });
        });
    });

    describe("patchTestplaneBaseUrl", () => {
        it("should update the baseUrl for all browsers", () => {
            const config = getConfig_({
                browsers: {
                    chrome: { baseUrl: "" },
                    firefox: { baseUrl: "" },
                },
            });

            const baseUrl = "http://localhost:6006";

            patchTestplaneBaseUrl(config, baseUrl);

            expect(config.browsers.chrome.baseUrl).toBe(baseUrl);
            expect(config.browsers.firefox.baseUrl).toBe(baseUrl);
        });
    });

    describe("disableTestplaneIsolation", () => {
        it("should disable isolation for all configured browsers", () => {
            const config = getConfig_({
                browsers: {
                    chrome: { isolation: true },
                    firefox: { isolation: true },
                },
            });
            disableTestplaneIsolation(config);

            expect(config.browsers.chrome.isolation).toBe(false);
            expect(config.browsers.firefox.isolation).toBe(false);
        });
    });
});
