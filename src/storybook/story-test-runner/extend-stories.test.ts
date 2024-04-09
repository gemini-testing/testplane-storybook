import { extendStoriesFromStoryFile } from "./extend-stories";
import { StorybookStory } from "./types";

describe("storybook/story-test-runner/extend-stories", () => {
    it("should fallback, when could not read story file", () => {
        const stories = [{ name: "foo", absolutePath: "not/existing.js" }] as StorybookStory[];

        const extendedStories = extendStoriesFromStoryFile(stories);

        expect(extendedStories[0].skip).toBe(false);
        expect(extendedStories[0].assertViewOpts).toEqual({});
        expect(extendedStories[0].browserIds).toBe(null);
    });

    it("should log warning on tsx file", () => {
        jest.spyOn(console, "warn").mockImplementation(jest.fn);
        const stories = [{ name: "foo", absolutePath: "not/existing.tsx" }] as StorybookStory[];

        extendStoriesFromStoryFile(stories);

        const expectedMsg = [
            "[@testplane/storybook]:",
            "reading .tsx story files is not supported.",
            '"testplane" section is ignored in "not/existing.tsx"',
        ].join(" ");
        expect(console.warn).toBeCalledWith(expectedMsg);
    });
});
