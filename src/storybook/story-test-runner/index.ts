import { extendStoriesFromStoryFile } from "./extend-stories";
import { nestedDescribe, extendedIt } from "./test-decorators";
import { openStory } from "./open-story";
import type { StoryLoadResult } from "./open-story/hermione-open-story";
import type { HermioneOpts } from "../story-to-test";
import type { TestFunctionExtendedCtx } from "../../types";
import type { StorybookStoryExtended, StorybookStory } from "./types";

export function getAbsoluteFilePath(): string {
    return __filename;
}

export function run(stories: StorybookStory[], opts: HermioneOpts): void {
    const withStoryFileDataStories = extendStoriesFromStoryFile(stories);

    withStoryFileDataStories.forEach(story => createHermioneTests(story, opts));
}

function createHermioneTests(story: StorybookStoryExtended, { autoScreenshots }: HermioneOpts): void {
    nestedDescribe(story, () => {
        if (autoScreenshots) {
            extendedIt(story, "Autoscreenshot", async function (ctx: TestFunctionExtendedCtx) {
                ctx.expect = globalThis.expect;

                const result = await openStoryStep(ctx.browser, story);

                await autoScreenshotStep(ctx.browser, result.rootSelector);
            });
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
    return browser.runStep("hermione-storybook: open story", () => openStory(browser, story));
}

async function autoScreenshotStep(browser: WebdriverIO.Browser, rootSelector: string): Promise<void> {
    await browser.runStep("hermione-storybook: autoscreenshot", () => browser.assertView("plain", rootSelector));
}

async function clearSessionStep(browser: WebdriverIO.Browser): Promise<void> {
    await browser.runStep("hermione-storybook: clear session", () => browser.clearSession());
}
