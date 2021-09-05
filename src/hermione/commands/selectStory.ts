import { STORYBOOK_PREVIEW } from "../constants";
import type { Args } from "@storybook/addons";
import type { SelectStoryStorybook } from "../../types";

type SelectStoryFunction = (storyId: string, args?: Args) => Promise<void>;

export function createSelectStory(storybookUrl: string): SelectStoryFunction {
    return async function (this: WebdriverIO.Browser, storyId: string, args: Args = {}): Promise<void> {
        const isStorybookApiInited = await this.execute<SelectStoryStorybook | undefined, []>(function () {
            return window.__HERMIONE_SELECT_STORY__;
        });

        if (!isStorybookApiInited) {
            const currUrl = await this.getUrl();
            const storybookIframeUrl = storybookUrl.includes(STORYBOOK_PREVIEW)
                ? storybookUrl
                : `${storybookUrl.replace(/\/$/, "")}/${STORYBOOK_PREVIEW}`;

            if (currUrl.includes(storybookIframeUrl)) {
                throw new Error("Hermione addon is not connected to storybook config");
            } else {
                await this.url(storybookIframeUrl);
            }
        }

        await this.executeAsync(
            function (storyId, args, doneCb) {
                window.__HERMIONE_SELECT_STORY__(storyId, args, doneCb);
            },
            storyId,
            args,
        );

        const newUrl = await this.getUrl();
        await this.setMeta("url", newUrl);
    };
}
