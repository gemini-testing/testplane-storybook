import { extendStoriesFromStoryFile } from "./extend-stories";
import { nestedDescribe, extendedIt } from "./test-decorators";
import { openStory } from "./open-story";
import type { StoryLoadResult } from "./open-story/testplane-open-story";
import type { TestplaneOpts } from "../story-to-test";
import type { TestFunctionExtendedCtx } from "../../types";
import type { StorybookStoryExtended, StorybookStory } from "./types";

export function getAbsoluteFilePath(): string {
    return __filename;
}

export function run(stories: StorybookStory[], opts: TestplaneOpts): void {
    const withStoryFileDataStories = extendStoriesFromStoryFile(stories);

    withStoryFileDataStories.forEach(story => createTestplaneTests(story, opts));
}

function createTestplaneTests(
    story: StorybookStoryExtended,
    { autoScreenshots, autoscreenshotSelector, autoScreenshotStorybookGlobals }: TestplaneOpts,
): void {
    nestedDescribe(story, () => {
        const rawAutoScreenshotGlobalSets = {
            ...autoScreenshotStorybookGlobals,
            ...story.autoScreenshotStorybookGlobals,
        };

        const screenshotGlobalSetNames = Object.keys(rawAutoScreenshotGlobalSets);

        const autoScreenshotGlobalSets = screenshotGlobalSetNames.length
            ? screenshotGlobalSetNames.map(name => ({ name, globals: rawAutoScreenshotGlobalSets[name] }))
            : [{ name: "", globals: {} }];

        if (autoScreenshots) {
            for (const { name, globals } of autoScreenshotGlobalSets) {
                extendedIt(
                    story,
                    `Autoscreenshot${name ? ` ${name}` : ""}`,
                    async function (ctx: TestFunctionExtendedCtx) {
                        ctx.expect = globalThis.expect;

                        const result = await openStoryStep(ctx.browser, story, globals);
                        const selector = story.autoscreenshotSelector || autoscreenshotSelector || result.rootSelector;

                        await autoScreenshotStep(ctx.browser, selector);
                    },
                );
            }
        }

        if (story.extraTests) {
            for (const testName in story.extraTests) {
                extendedIt(story, testName, async function (ctx: TestFunctionExtendedCtx) {
                    ctx.expect = globalThis.expect;

                    await openStoryStep(ctx.browser, story);

                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    await story.extraTests![testName].call(ctx, ctx);

                    await clearSessionStep(ctx.browser);
                });
            }
        }
    });
}

async function openStoryStep(
    browser: WebdriverIO.Browser,
    story: StorybookStoryExtended,
    storybookGlobals: Record<string, unknown> = {},
): Promise<StoryLoadResult> {
    return browser.runStep("@testplane/storybook: open story", () => openStory(browser, story, storybookGlobals));
}

async function autoScreenshotStep(browser: WebdriverIO.Browser, rootSelector: string): Promise<void> {
    await browser.runStep("@testplane/storybook: autoscreenshot", () => browser.assertView("plain", rootSelector));
}

async function clearSessionStep(browser: WebdriverIO.Browser): Promise<void> {
    await browser.runStep("@testplane/storybook: clear session", () => browser.clearSession());
}
