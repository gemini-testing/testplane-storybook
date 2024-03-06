import type { Config } from "hermione";
import _ from "lodash";
import { STORYBOOK_KNOWN_PATH_ENDINGS, STORYBOOK_SET_NAME } from "./constants";
import { getStorybookPathEndingWith, patchHermioneSets, disableHermioneIsolation, patchHermioneBaseUrl } from "./utils";

describe("utils", () => {
    const getConfig_ = (config: Record<string, any>): Config => {
        config.getBrowserIds = function () {
            return Object.keys(this.browsers);
        };

        config.forBrowser = function (browserId: string) {
            return this.browsers[browserId];
        };

        return config as Config;
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

    describe("patchHermioneSets", () => {
        it("should create a new set with the specified browsers and files", () => {
            const config = getConfig_({
                browsers: {
                    chrome: {},
                    firefox: {},
                },
                sets: {},
            });
            const browserIds = ["chrome"];
            const files = ["file1", "file2"];

            patchHermioneSets(config, browserIds, files);

            expect(config.sets).toEqual({
                [STORYBOOK_SET_NAME]: {
                    browsers: ["chrome"],
                    files: ["file1", "file2"],
                },
            });
        });

        it("should use all browsers from the config if no browserIds are specified", () => {
            const config = getConfig_({
                browsers: {
                    chrome: {},
                    firefox: {},
                },
                sets: {},
            });
            const files = ["file1", "file2"];

            patchHermioneSets(config, [], files);

            expect(config.sets).toEqual({
                [STORYBOOK_SET_NAME]: {
                    browsers: ["chrome", "firefox"],
                    files: ["file1", "file2"],
                },
            });
        });
    });

    describe("patchHermioneBaseUrl", () => {
        it("should update the baseUrl for all browsers", () => {
            const config = getConfig_({
                browsers: {
                    chrome: { baseUrl: "" },
                    firefox: { baseUrl: "" },
                },
            });

            const baseUrl = "http://localhost:6006";

            patchHermioneBaseUrl(config, baseUrl);

            expect(config.browsers.chrome.baseUrl).toBe(baseUrl);
            expect(config.browsers.firefox.baseUrl).toBe(baseUrl);
        });
    });

    describe("disableHermioneIsolation", () => {
        it("should disable isolation for the specified browsers", () => {
            const config = getConfig_({
                browsers: {
                    chrome: { isolation: true },
                    firefox: { isolation: true },
                },
            });
            const browserIds = ["chrome"];

            disableHermioneIsolation(config, browserIds);

            expect(config.browsers.chrome.isolation).toBe(false);
            expect(config.browsers.firefox.isolation).toBe(true);
        });

        it("should disable isolation for all browsers if no browserIds are specified", () => {
            const config = getConfig_({
                browsers: {
                    chrome: { isolation: true },
                    firefox: { isolation: true },
                },
            });

            disableHermioneIsolation(config, []);

            expect(config.browsers.chrome.isolation).toBe(false);
            expect(config.browsers.firefox.isolation).toBe(false);
        });
    });
});
