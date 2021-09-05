import type { Args } from "@storybook/addons";

export type SelectStoryHermione = (storyId: string, args?: Args) => Promise<void>;
export type SelectStoryStorybook = (
    storyId: string,
    args?: Args,
    callback?: (result?: unknown) => void,
) => Promise<void>;

export type StoryRenderError = {
    title: string;
    description: string;
};

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace WebdriverIO {
        interface Browser {
            selectStory: SelectStoryHermione;
        }
    }
}
