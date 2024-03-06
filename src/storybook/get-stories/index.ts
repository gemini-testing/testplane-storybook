import _ from "lodash";
import path from "path";
import { getStorybookPathEndingWith } from "../../utils";
import { StorybookRawStory, extractStories, storybookDataJsonPaths } from "./extract-stories";
import { waitStorybookDataJson } from "./wait-storybook-data-json";

export interface StorybookStoryExtended extends StorybookRawStory {
    absolutePath: string;
}

const withAbsolutePath = (story: StorybookRawStory): StorybookStoryExtended => ({
    ...story,
    absolutePath: path.resolve(process.cwd(), story.importPath),
});

export const getStories = async (storybookUrl: string): Promise<StorybookStoryExtended[]> => {
    const storybookJsonUrls = storybookDataJsonPaths.map(jsonPath =>
        getStorybookPathEndingWith(storybookUrl, jsonPath),
    );

    const storiesJson = await waitStorybookDataJson(storybookJsonUrls);

    const stories = extractStories(storiesJson);

    if (_.isEmpty(stories)) {
        throw new Error("Couldn't find storybook stories");
    }

    return stories.map(withAbsolutePath);
};
