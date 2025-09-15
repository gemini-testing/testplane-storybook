import TypedModule from "module";
import { extractInheritedValue, inheritValue } from "./inheritable-values";
import type { TestplaneMetaConfig, TestplaneStoryConfig } from "../../types";
import type { StorybookStory, StorybookStoryExtraProperties, StorybookStoryExtended } from "./types";

const Module = TypedModule as any; // eslint-disable-line @typescript-eslint/no-explicit-any
const MockedModuleProxySymbol = Symbol("@testplane/storybook:mocked-module-proxy");
type MockedModuleProxy = { [MockedModuleProxySymbol]?: boolean };

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

        const storyContents = removeNestedMockedPropertiesPaths(storyFile[storyName]);
        const storyTestlaneConfigs = storyContents.testplaneConfig || {};
        const story = storiesMap.get(storyMapKey) as StorybookStoryExtended;

        Object.assign(story, storyExtendedBaseConfig, storyTestplaneDefaultConfigs, storyTestlaneConfigs, {
            extraTests: storyContents.testplane || null,
        });

        story.assertViewOpts = extractInheritedValue(
            inheritValue(storyTestplaneDefaultConfigs.assertViewOpts, storyTestlaneConfigs.assertViewOpts),
            storyExtendedBaseConfig.assertViewOpts,
        );

        story.autoScreenshotStorybookGlobals =
            inheritValue(
                storyExtendedBaseConfig.autoScreenshotStorybookGlobals,
                storyTestplaneDefaultConfigs.autoScreenshotStorybookGlobals,
                storyTestlaneConfigs.autoScreenshotStorybookGlobals,
            ) || {};
    }

    for (const story of withStoryFileExtendedStories) {
        for (const essentialProperty in storyExtendedBaseConfig) {
            if (!Object.hasOwn(story, essentialProperty)) {
                Object.assign(story, {
                    [essentialProperty]:
                        storyExtendedBaseConfig[essentialProperty as keyof StorybookStoryExtraProperties],
                });
            }
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

function getStoryFile(storyPath: string, { requireFn = require } = {}): StoryFile | null {
    const unmockFn = mockLoaders({ except: storyPath });
    const disableWarningsMessage = [
        "There could be other story files.",
        "Set 'TESTPLANE_STORYBOOK_DISABLE_STORY_REQUIRE_WARNING' environment variable to hide this warning",
    ].join("\n");

    let storyFile;

    try {
        storyFile = requireFn(storyPath);
    } catch (error) {
        if (!loggedStoryFileRequireError) {
            loggedStoryFileRequireError = true;

            const warningMessage = [
                `Testplane custom section is ignored in storyfile "${storyPath}",`,
                `because the file could not be read:\n${error}\n${disableWarningsMessage}`,
            ].join(" ");

            console.warn(warningMessage);
        }
    }

    unmockFn();

    const isStoryFileFailedToLoad = !storyFile || isMockedModuleProxy(storyFile);

    if (isStoryFileFailedToLoad) {
        return null;
    }

    const ignoredProperties = getStoryFilMockedeNestedPropertiesPaths(storyFile);

    if (ignoredProperties.length && !loggedStoryFileRequireError) {
        loggedStoryFileRequireError = true;
        const warningMessage = [
            `Following Testplane custom properties are ignored in storyfile "${storyPath}":\n`,
            ...ignoredProperties.map(property => `- ${property}\n`),
            "Reason: Testplane couldn't handle imports in this file.\n",
            disableWarningsMessage,
        ].join("");
        console.warn(warningMessage);
    }

    return storyFile;
}

const getBlackholeProxy = (): any => // eslint-disable-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    new Proxy(function () {}, {
        get: (_, prop) => {
            switch (prop) {
                // string conversion
                case "toString":
                case "valueOf":
                case Symbol.toPrimitive:
                    return () => "[proxy Object]";
                case Symbol.toStringTag:
                    return "Proxy";
                // iterators
                case Symbol.iterator:
                    // eslint-disable-next-line @typescript-eslint/no-empty-function
                    return function* () {};
                case Symbol.asyncIterator:
                    // eslint-disable-next-line @typescript-eslint/no-empty-function
                    return async function* () {};
                // string methods
                case Symbol.match:
                    return false;
                case Symbol.matchAll:
                    return () => null;
                case Symbol.search:
                    return () => -1;
                case Symbol.split:
                    return (str: unknown) => str;

                case Symbol.hasInstance:
                    return () => false;

                case MockedModuleProxySymbol:
                    return true;

                default:
                    return getBlackholeProxy();
            }
        },
        // traps
        apply: getBlackholeProxy,
        construct: getBlackholeProxy,
        // inspection
        getPrototypeOf: () => null,
        has: () => false,
        ownKeys: () => ["prototype"],
        getOwnPropertyDescriptor: (_, prop) => ({
            configurable: prop !== "prototype",
            enumerable: prop !== "prototype",
            value: getBlackholeProxy(),
            writable: true,
        }),
        // extensibility checks
        isExtensible: () => true,
        preventExtensions: () => false,
        // mutation
        set: () => true,
        defineProperty: () => true,
        deleteProperty: () => true,
        setPrototypeOf: () => true,
    });

function mockLoaders(opts: { except?: string }): () => void {
    const unmockWindow = mockWindow();
    const unmockNotExistingModule = mockNotExistingModule();
    const unmockModuleCbs = [".css", ".scss", ".svg", ".png", ".ico", ".jpg", ".jpeg", ".gif", ".yml"].map(mockModule);
    const unmockFailedModuleCbs = [".js", ".ts", ".jsx", ".tsx", ".mjs", ".mts"].map(ext =>
        mockFailedModule(ext, opts),
    );

    const unmockFns = [...unmockFailedModuleCbs, ...unmockModuleCbs, unmockNotExistingModule, unmockWindow];

    return () => unmockFns.forEach(unmock => unmock());
}

function mockNotExistingModule(): () => void {
    const originalLoad = Module._load;

    Module._load = function (request: string, parent: unknown) {
        try {
            Module._resolveFilename(request, parent);
        } catch (err) {
            return getBlackholeProxy();
        }

        // eslint-disable-next-line prefer-rest-params
        return originalLoad.apply(this, arguments);
    };

    return () => {
        Module._load = originalLoad;
    };
}

function mockWindow(): () => void {
    const originalWindow = globalThis.window;

    globalThis.window = getBlackholeProxy();

    return () => {
        globalThis.window = originalWindow;
    };
}

function mockModule(extension: string): () => void {
    const originalModule = Module._extensions[extension];

    Module._extensions[extension] = () => void 0;

    return () => {
        Module._extensions[extension] = originalModule;
    };
}

function isMockedModuleProxy(obj: MockedModuleProxy): boolean {
    return Boolean(obj && obj[MockedModuleProxySymbol] === true);
}

function getStoryFilMockedeNestedPropertiesPaths(storyFile: StoryFile): string[] {
    const results = [] as string[];
    const customProperties = ["testplane", "testplaneConfig"] as const;

    for (const exportName in storyFile) {
        if (isMockedModuleProxy(storyFile[exportName] as MockedModuleProxy)) {
            results.push(exportName);
        } else {
            for (const customProperty of customProperties) {
                const customMockedProperties = getNestedMockedPropertiesPaths(
                    storyFile[exportName][customProperty],
                    `${exportName}.${customProperty}`,
                );

                if (customMockedProperties) {
                    results.push(...customMockedProperties);
                }
            }
        }
    }

    return results;
}

function getNestedMockedPropertiesPaths(obj: unknown, parentProperty = ""): string[] | null {
    if (!obj || (typeof obj !== "object" && typeof obj !== "function")) {
        return null;
    }

    if (isMockedModuleProxy(obj)) {
        return [parentProperty];
    }

    const results = [];

    for (const property in obj) {
        const nestedValue = obj[property as keyof typeof obj];
        const nestedKey = parentProperty + "." + property;

        const nestedResults = getNestedMockedPropertiesPaths(nestedValue, nestedKey);

        if (nestedResults) {
            results.push(...nestedResults);
        }
    }

    return results.length ? results : null;
}

function removeNestedMockedPropertiesPaths<T = unknown>(obj: T): T {
    if (isMockedModuleProxy(obj as MockedModuleProxy)) {
        return {} as T;
    }

    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
        return obj;
    }

    const result = {} as T;

    for (const prop in obj) {
        const property = prop as keyof typeof obj;

        if (!isMockedModuleProxy(obj[property] as MockedModuleProxy)) {
            result[property] = removeNestedMockedPropertiesPaths(obj[property]);
        }
    }

    return result;
}

function mockFailedModule(extension: string, { except }: { except?: string }): () => void {
    const originalModule = Module._extensions[extension];

    const applyMock = (filename: string): void => {
        require.cache[filename].loaded = true;
        require.cache[filename].exports = getBlackholeProxy();
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
