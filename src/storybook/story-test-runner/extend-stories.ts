import TypedModule from "module";
import type { TestplaneMetaConfig, TestplaneStoryConfig } from "../../types";
import type { StorybookStory, StorybookStoryExtraProperties, StorybookStoryExtended } from "./types";

const Module = TypedModule as any; // eslint-disable-line @typescript-eslint/no-explicit-any

interface ImportingModule {
    _compile: (code: string, fileName: string) => unknown;
}

type StoryFile = { default: TestplaneMetaConfig } & Record<string, TestplaneStoryConfig>;

let loggedStoryFileRequireError = Boolean(process.env.TESTPLANE_STORYBOOK_DISABLE_STORY_REQUIRE_WARNING);

export function extendStoriesFromStoryFile(
    stories: StorybookStory[],
    { requireFn = require } = {},
): StorybookStoryExtended[] {
    const storiesMap = getStoriesMap(stories);
    const storyPath = stories[0].absolutePath;
    const storyFile = getStoryFile(storyPath, { requireFn });
    const withStoryFileExtendedStories = stories as StorybookStoryExtended[];

    const storyExtendedBaseConfig = {
        skip: false,
        browserIds: null,
        assertViewOpts: {},
        autoScreenshots: null,
        autoscreenshotSelector: null,
        autoScreenshotStorybookGlobals: {},
        extraTests: null,
    } satisfies StorybookStoryExtraProperties;

    if (!storyFile) {
        return withStoryFileExtendedStories.map(story => Object.assign(story, storyExtendedBaseConfig));
    }

    const storyTestplaneDefaultConfigs = storyFile.default?.testplaneConfig || storyFile.default?.testplane || {};

    for (const storyName of Object.keys(storyFile)) {
        if (storyName === "default") {
            continue;
        }

        const storyMapKey = getStoryNameId(storyName);

        if (!storiesMap.has(storyMapKey)) {
            continue;
        }

        const storyTestlaneConfigs = storyFile[storyName].testplaneConfig || {};
        const story = storiesMap.get(storyMapKey) as StorybookStoryExtended;

        Object.assign(story, storyExtendedBaseConfig, storyTestplaneDefaultConfigs, storyTestlaneConfigs, {
            extraTests: storyFile[storyName].testplane || null,
        });

        story.assertViewOpts = Object.assign(
            {},
            storyExtendedBaseConfig.assertViewOpts,
            storyTestplaneDefaultConfigs.assertViewOpts,
            storyTestlaneConfigs.assertViewOpts,
        );

        story.autoScreenshotStorybookGlobals = Object.assign(
            {},
            storyExtendedBaseConfig.autoScreenshotStorybookGlobals,
            storyTestplaneDefaultConfigs.autoScreenshotStorybookGlobals,
            storyTestlaneConfigs.autoScreenshotStorybookGlobals,
        );
    }

    return withStoryFileExtendedStories;
}

function getStoriesMap(stories: StorybookStory[]): Map<string, StorybookStory> {
    const storiesMap = new Map();

    stories.forEach(story => {
        storiesMap.set(getStoryNameId(story.name), story);
    });

    return storiesMap;
}

function getStoryNameId(storyName: string): string {
    // https://github.com/lodash/lodash/blob/4.17.15/lodash.js#L166
    // eslint-disable-next-line no-control-regex
    const nonAsciiWordRegExp = /[\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;

    return storyName.replace(nonAsciiWordRegExp, "").toLowerCase();
}

function getStoryFile(storyPath: string, { requireFn = require } = {}): StoryFile | null {
    const unmockFn = mockLoaders({ except: storyPath });

    let storyFile;

    try {
        storyFile = requireFn(storyPath);
    } catch (error) {
        if (!loggedStoryFileRequireError) {
            loggedStoryFileRequireError = true;

            const warningMessage = [
                `"testplane" section is ignored in storyfile "${storyPath}",`,
                `because the file could not be read:\n${error}`,
                "\nThere could be other story files.",
                "\nSet 'TESTPLANE_STORYBOOK_DISABLE_STORY_REQUIRE_WARNING' environment variable to hide this warning",
            ].join(" ");

            console.warn(warningMessage);
        }
    }

    const isStoryFileFailedToLoad = !storyFile || typeof storyFile === "function";

    unmockFn();

    return isStoryFileFailedToLoad ? null : storyFile;
}

function mockLoaders(opts: { except?: string }): () => void {
    const unmockModuleCbs = [".css", ".scss", ".svg", ".png", ".ico", ".jpg", ".jpeg", ".gif", ".yml"].map(mockModule);
    const unmockFailedModuleCbs = [".js", ".ts", ".jsx", ".tsx", ".mjs", ".mts"].map(ext =>
        mockFailedModule(ext, opts),
    );
    const unmockCb = (): void => unmockModuleCbs.concat(unmockFailedModuleCbs).forEach(unmock => unmock());

    return unmockCb;
}

function mockModule(extension: string): () => void {
    const originalModule = Module._extensions[extension];

    Module._extensions[extension] = () => void 0;

    return () => {
        Module._extensions[extension] = originalModule;
    };
}

function mockFailedModule(extension: string, { except }: { except?: string }): () => void {
    const originalModule = Module._extensions[extension];
    const getMockedModuleProxy = (): any => // eslint-disable-line @typescript-eslint/no-explicit-any
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        new Proxy(function () {}, {
            get: getMockedModuleProxy,
            apply: getMockedModuleProxy,
            construct: getMockedModuleProxy,
            getOwnPropertyDescriptor: Reflect.getOwnPropertyDescriptor,
            getPrototypeOf: getMockedModuleProxy,
            setPrototypeOf: getMockedModuleProxy,
            set: (_, __, val) => val,
            defineProperty: () => true,
            deleteProperty: () => true,
            preventExtensions: () => true,
            ownKeys: Reflect.ownKeys,
            isExtensible: () => false,
            has: () => false,
        });

    const applyMock = (filename: string): void => {
        require.cache[filename].loaded = true;
        require.cache[filename].exports = getMockedModuleProxy();
    };

    Module._extensions[extension] = (m: ImportingModule, filename: string) => {
        if (filename === except) {
            return originalModule(m, filename);
        }

        if (filename.includes("/node_modules/@storybook/")) {
            return applyMock(filename);
        }

        try {
            return originalModule(m, filename);
        } catch (e) {
            applyMock(filename);
        }
    };

    return () => {
        Module._extensions[extension] = originalModule;
    };
}
