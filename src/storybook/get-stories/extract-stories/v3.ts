import type { StorybookRawStory } from "./index";
import { STORYBOOK_STORIES_JSON_PATH } from "../../../constants";

export const supportedStoryVersionV3 = 3 as const;

export interface StorybookStoriesJson {
    v: typeof supportedStoryVersionV3;
    stories: Record<string, Omit<StorybookRawStory, "type">>;
}

export const storybookDataJsonPathV3 = STORYBOOK_STORIES_JSON_PATH;

export const extractStoriesV3 = (dataJson: StorybookStoriesJson): StorybookRawStory[] => {
    return Object.values(dataJson.stories)
        .filter(story => !story.tags?.includes("docs"))
        .map(story => ({ ...story, type: "story" }));
};
