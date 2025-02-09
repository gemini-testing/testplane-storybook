import { extendStoriesFromStoryFile } from "./extend-stories";
import { StorybookStory } from "./types";

describe("storybook/story-test-runner/extend-stories", () => {
    const mkRequireStub_ = (
        impl?: Parameters<(typeof jest)["fn"]>[0],
    ): jest.MockedFunction<(typeof globalThis)["require"]> => {
        return jest.fn(impl) as unknown as jest.MockedFunction<(typeof globalThis)["require"]>;
    };

    it("should log warning failed storyfile import", () => {
        jest.spyOn(console, "warn").mockImplementation(jest.fn);
        const requireFn = mkRequireStub_(() => {
            throw new Error("some error message");
        });
        const stories = [{ name: "foo", absolutePath: "not/existing.ts" }] as StorybookStory[];

        extendStoriesFromStoryFile(stories, { requireFn });

        const expectedMsg = [
            '"testplane" section is ignored in storyfile "not/existing.ts", because the file could not be read:',
            "Error: some error message ",
            "There could be other story files. ",
            "Set 'TESTPLANE_STORYBOOK_DISABLE_STORY_REQUIRE_WARNING' environment variable to hide this warning",
        ].join("\n");
        expect(console.warn).toBeCalledWith(expectedMsg);
    });

    it("should fallback, when could not read story file", () => {
        const requireFn = mkRequireStub_(() => {
            throw new Error("file does not exist");
        });
        const stories = [{ name: "foo", absolutePath: "not/existing.js" }] as StorybookStory[];

        const extendedStories = extendStoriesFromStoryFile(stories, { requireFn });

        expect(extendedStories[0].skip).toBe(false);
        expect(extendedStories[0].assertViewOpts).toEqual({});
        expect(extendedStories[0].browserIds).toBe(null);
    });

    it("should overlay story configs over file configs", () => {
        const customTests = {};
        const defaultExport = {
            testplane: { browserIds: ["firefox"] },
            testplaneConfig: {
                skip: true,
                browserIds: ["chrome"],
                assertViewOpts: { tolerance: 10, ignoreDiffPixelCount: 10 },
                autoScreenshotStorybookGlobals: { dark: { theme: "dark" } },
            },
        };
        const fooExport = {
            testplane: customTests,
            testplaneConfig: { skip: false, autoScreenshots: false, assertViewOpts: { ignoreElements: ["foobar"] } },
        };
        const requireFn = mkRequireStub_().mockReturnValue({ default: defaultExport, foo: fooExport });
        const stories = [{ name: "foo", absolutePath: "not/existing.js" }] as StorybookStory[];

        const extendedStories = extendStoriesFromStoryFile(stories, { requireFn });

        expect(extendedStories).toMatchObject([
            {
                name: "foo",
                absolutePath: "not/existing.js",
                extraTests: {},
                skip: false,
                browserIds: ["chrome"],
                assertViewOpts: {
                    ignoreElements: ["foobar"],
                    tolerance: 10,
                    ignoreDiffPixelCount: 10,
                },
                autoScreenshots: false,
                autoScreenshotStorybookGlobals: { dark: { theme: "dark" } },
            },
        ]);
    });

    it("should overlay story configs over default configs", () => {
        const customTests = {};
        const fooExport = {
            testplane: customTests,
            testplaneConfig: { skip: false, autoScreenshots: false, assertViewOpts: { ignoreElements: ["foobar"] } },
        };
        const requireFn = mkRequireStub_().mockReturnValue({ default: {}, foo: fooExport });
        const stories = [{ name: "foo", absolutePath: "not/existing.js" }] as StorybookStory[];

        const extendedStories = extendStoriesFromStoryFile(stories, { requireFn });

        expect(extendedStories).toMatchObject([
            {
                name: "foo",
                absolutePath: "not/existing.js",
                extraTests: {},
                skip: false,
                browserIds: null,
                assertViewOpts: {
                    ignoreElements: ["foobar"],
                },
                autoScreenshots: false,
                autoscreenshotSelector: null,
                autoScreenshotStorybookGlobals: {},
            },
        ]);
    });

    it("should fallback reading story configs from deprecated testplane property", () => {
        const stories = [{ name: "foo", absolutePath: "not/existing.js" }] as StorybookStory[];
        const requireFn = mkRequireStub_().mockReturnValue({ default: { testplane: { skip: true } }, foo: {} });

        const extendedStories = extendStoriesFromStoryFile(stories, { requireFn });

        expect(extendedStories).toMatchObject([{ name: "foo", skip: true }]);
    });
});
