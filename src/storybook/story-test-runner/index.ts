import { extendStoriesFromStoryFile } from "./extend-stories";
import { nestedDescribe, extendedIt } from "./test-decorators";
import { openStory, StorybookWindow } from "./open-story";
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

function createTestplaneTests(story: StorybookStoryExtended, { autoScreenshots, customAutoScreenshots }: TestplaneOpts): void {
    nestedDescribe(story, () => {
        if (autoScreenshots) {
            if (customAutoScreenshots) {
                for (const testName in customAutoScreenshots) {
                    extendedIt(story, testName, async function (ctx: TestFunctionExtendedCtx) {
                        ctx.expect = globalThis.expect;

                        const result = await openStoryStep(ctx.browser, story);
                        await setGlobalsStep(ctx.browser, customAutoScreenshots[testName].globals);
                        await autoScreenshotStep(ctx.browser, story.autoscreenshotSelector || result.rootSelector);
                    });
                }
            } else {
                extendedIt(story, "Autoscreenshot", async function (ctx: TestFunctionExtendedCtx) {
                    ctx.expect = globalThis.expect;

                    const result = await openStoryStep(ctx.browser, story);

                    await autoScreenshotStep(ctx.browser, story.autoscreenshotSelector || result.rootSelector);
                });
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

async function openStoryStep(browser: WebdriverIO.Browser, story: StorybookStoryExtended): Promise<StoryLoadResult> {
    return browser.runStep("@testplane/storybook: open story", () => openStory(browser, story));
}

async function setGlobalsStep(browser: WebdriverIO.Browser, globals: Record<string, unknown>): Promise<void> {
    return browser.runStep("@testplane/storybook: set globals", () => {
        return browser.execute(async (globals) => {
            const channel = (window as StorybookWindow).__STORYBOOK_ADDONS_CHANNEL__;
            channel.emit("updateGlobals", { globals });
        }, globals);
    });
}

async function autoScreenshotStep(browser: WebdriverIO.Browser, rootSelector: string): Promise<void> {
    await browser.runStep("@testplane/storybook: autoscreenshot", () => browser.assertView("plain", rootSelector));
}

async function clearSessionStep(browser: WebdriverIO.Browser): Promise<void> {
    await browser.runStep("@testplane/storybook: clear session", () => browser.clearSession());
}
