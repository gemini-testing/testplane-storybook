import type { StorybookRawStory } from "./index";
import { STORYBOOK_INDEX_JSON_PATH } from "../../../constants";

export const supportedStoryVersionV4 = 4 as const;

export type StorybookIndexJson = {
    v: typeof supportedStoryVersionV4;
    entries: Record<string, StorybookRawStory>;
};

export const storybookDataJsonPathV4 = STORYBOOK_INDEX_JSON_PATH;

export const extractStoriesV4 = (dataJson: StorybookIndexJson): StorybookRawStory[] => {
    return Object.values(dataJson.entries).filter(entry => entry.type === "story");
};
