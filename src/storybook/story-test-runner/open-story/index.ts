import { PlayFunctionError } from "../play-function-error";
import testplaneOpenStory from "./testplane-open-story";
export type { StorybookWindow } from "./testplane-open-story";
import type { ExecutionContextExtended, StorybookStoryExtended } from "../types";
import type { StoryLoadResult } from "./testplane-open-story";

export async function openStory(
    browser: WebdriverIO.Browser,
    story: StorybookStoryExtended,
    storybookGlobals: Record<string, unknown>,
): Promise<StoryLoadResult> {
    const browserConfig = await browser.getConfig();
    const currentBrowserUrl = await browser.getUrl();

    const iframeUrlObj = new URL(browserConfig.baseUrl);
    const currentUrlObj = new URL(currentBrowserUrl);

    const isOnStorybookPage =
        currentUrlObj.host === iframeUrlObj.host && currentUrlObj.pathname.includes("iframe.html");
    const shouldRemount = isOnStorybookPage && currentUrlObj.searchParams.get("id") === story.id;

    if (!isOnStorybookPage) {
        const storybookIframeUrl = await getStorybookIframeUrl(browser);

        await browser.runStep("open storybook url", () => browser.url(storybookIframeUrl));
    }

    await extendBrowserMeta(browser, story);

    return browser.runStep("wait story load", async (): Promise<StoryLoadResult> => {
        const storyLoadResult = await testplaneOpenStory.execute(browser, story.id, storybookGlobals, shouldRemount);

        if (storyLoadResult.loadError) {
            throw new Error(storyLoadResult.loadError);
        }

        if (storyLoadResult.playFunctionError) {
            throw new PlayFunctionError(storyLoadResult.playFunctionError);
        }

        if (!story.autoscreenshotSelector && !storyLoadResult.rootSelector) {
            throw new Error("Story root selector is not found");
        }

        return storyLoadResult;
    });
}

async function getStorybookIframeUrl(browser: WebdriverIO.Browser): Promise<string> {
    const browserConfig = await browser.getConfig();

    const iframeUrlObj = new URL(browserConfig.baseUrl);

    iframeUrlObj.searchParams.set("instrument", String(true));
    iframeUrlObj.searchParams.set("viewMode", "story");

    return iframeUrlObj.toString();
}

async function extendBrowserMeta(browser: WebdriverIO.Browser, story: StorybookStoryExtended): Promise<void> {
    const storybookIframeUrl = await getStorybookIframeUrl(browser);
    const urlObj = new URL(storybookIframeUrl);

    urlObj.searchParams.set("id", story.id);
    urlObj.searchParams.set("path", `/${story.type}/${story.id}`);

    (browser.executionContext as ExecutionContextExtended)["@testplane/storybook-assertView-opts"] =
        story.assertViewOpts;

    await browser.setMeta("url", urlObj.toString().replace("iframe.html", "index.html"));
    await browser.setMeta("storyFile", story.importPath);
}
