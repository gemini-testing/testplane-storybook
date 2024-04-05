import TypedModule from "module";
import type { HermioneMetaConfig, HermioneStoryConfig } from "../../types";
import type { StorybookStory, StorybookStoryExtended } from "./types";

const Module = TypedModule as any; // eslint-disable-line @typescript-eslint/no-explicit-any

interface ImportingModule {
    _compile: (code: string, fileName: string) => unknown;
}

type StoryFile = { default: HermioneMetaConfig } & Record<string, HermioneStoryConfig>;

export function extendStoriesFromStoryFile(stories: StorybookStory[]): StorybookStoryExtended[] {
    const storiesMap = getStoriesMap(stories);
    const storyPath = stories[0].absolutePath;
    const storyFile = getStoryFile(storyPath);
    const withStoryFileExtendedStories = stories as StorybookStoryExtended[];

    if (!storyFile) {
        if (storyPath.endsWith(".tsx")) {
            const msg = [
                "[hermione-storybook]:",
                "reading .tsx story files is not supported.",
                `"hermione" section is ignored in "${storyPath}"`,
            ].join(" ");

            console.warn(msg);
        }

        return withStoryFileExtendedStories.map(story => {
            story.skip = false;
            story.assertViewOpts = {};
            story.browserIds = null;

            return story;
        });
    }

    for (const storyName in storyFile) {
        if (storyName === "default") {
            withStoryFileExtendedStories.forEach(story => {
                const hermioneStoryOpts = storyFile[storyName].hermione || {};

                story.skip = hermioneStoryOpts.skip || false;
                story.assertViewOpts = hermioneStoryOpts.assertViewOpts || {};
                story.browserIds = hermioneStoryOpts.browserIds || null;
            });

            continue;
        }

        const storyMapKey = getStoryNameId(storyName);

        if (storiesMap.has(storyMapKey) && storyFile[storyName].hermione) {
            const story = storiesMap.get(storyMapKey) as StorybookStoryExtended;

            story.extraTests = storyFile[storyName].hermione;
        }
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

function getStoryFile(storyPath: string): StoryFile | null {
    const unmockFn = mockLoaders();

    let storyFile;

    try {
        storyFile = require(storyPath); // eslint-disable-line @typescript-eslint/no-var-requires
    } catch (_) {} // eslint-disable-line no-empty

    const isStoryFileFailedToLoad = !storyFile || typeof storyFile === "function";

    unmockFn();

    return isStoryFileFailedToLoad ? null : storyFile;
}

function mockLoaders(): () => void {
    const unmockModuleCbs = [".css", ".scss", ".svg", ".png", ".ico", ".jpg", ".jpeg", ".gif", ".yml"].map(mockModule);
    const unmockFailedModuleCbs = [".js", ".ts", ".jsx", ".tsx", ".mjs", ".mts"].map(mockFailedModule);
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

function mockFailedModule(extension: string): () => void {
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
