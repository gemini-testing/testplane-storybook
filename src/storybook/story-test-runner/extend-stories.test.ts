import { extendStoriesFromStoryFile } from "./extend-stories";
import { StorybookStory } from "./types";

describe("storybook/story-test-runner/extend-stories", () => {
    it("should log warning failed storyfile import", async () => {
        jest.spyOn(console, "warn").mockImplementation(jest.fn);
        const stories = [{ name: "foo", absolutePath: "not/existing.ts" }] as StorybookStory[];

        extendStoriesFromStoryFile(stories);

        const expectedMsg = [
            '"testplane" section is ignored in storyfile "not/existing.ts", because the file could not be read:',
            "Error: Cannot find module 'not/existing.ts' from 'src/storybook/story-test-runner/extend-stories.ts' ",
            "There could be other story files. ",
            "Set 'TESTPLANE_STORYBOOK_DISABLE_STORY_REQUIRE_WARNING' environment variable to hide this warning",
        ].join("\n");
        expect(console.warn).toBeCalledWith(expectedMsg);
    });

    it("should fallback, when could not read story file", async () => {
        const stories = [{ name: "foo", absolutePath: "not/existing.js" }] as StorybookStory[];

        const extendedStories = extendStoriesFromStoryFile(stories);

        expect(extendedStories[0].skip).toBe(false);
        expect(extendedStories[0].assertViewOpts).toEqual({});
        expect(extendedStories[0].browserIds).toBe(null);
    });
});
