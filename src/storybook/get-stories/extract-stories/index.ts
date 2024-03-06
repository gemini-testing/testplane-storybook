import { STORYBOOK_JSON_SUPPORTED_VERSIONS } from "../../../constants";
import { supportedStoryVersionV3, extractStoriesV3, StorybookStoriesJson, storybookDataJsonPathV3 } from "./v3";
import { StorybookIndexJson, extractStoriesV4, storybookDataJsonPathV4 } from "./v4";
import logger from "../../../logger";

export type StorybookRawStory = {
    id: string;
    title: string;
    name: string;
    importPath: string;
    type: string;
    tags?: string[];
};

export type StorybookDataJson = StorybookStoriesJson | StorybookIndexJson;

export const storybookDataJsonPaths = [storybookDataJsonPathV3, storybookDataJsonPathV4];

export const extractStories = (storiesJson: StorybookDataJson): StorybookRawStory[] => {
    if (!STORYBOOK_JSON_SUPPORTED_VERSIONS.includes(storiesJson.v)) {
        logger.warn("Unsupported version of stories json");
        logger.warn(`'${STORYBOOK_JSON_SUPPORTED_VERSIONS.join(", ")}' expected, but ${storiesJson.v} found`);
        logger.warn("I'll try to do my best with it!");
    }

    return storiesJson.v === supportedStoryVersionV3 ? extractStoriesV3(storiesJson) : extractStoriesV4(storiesJson);
};
