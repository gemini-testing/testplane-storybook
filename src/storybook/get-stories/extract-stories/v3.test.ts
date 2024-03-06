import { extractStoriesV3 } from "./v3";

describe("storybook/get-stories/extract-stories/v3", () => {
    it('should return stories without "docs" tag, enriched with "story" type', () => {
        const dataJson = {
            v: 3 as const,
            stories: {
                story1: {
                    id: "1",
                    title: "example/story1",
                    importPath: "./story1.story.ts",
                    name: "story1",
                    tags: ["docs"],
                },
                story2: {
                    id: "2",
                    title: "example/story2",
                    importPath: "./story2.story.ts",
                    name: "story2",
                    tags: ["story"],
                },
            },
        };

        const expectedOutput = [
            {
                id: "2",
                type: "story",
                title: "example/story2",
                importPath: "./story2.story.ts",
                name: "story2",
                tags: ["story"],
            },
        ];

        const result = extractStoriesV3(dataJson);
        expect(result).toEqual(expectedOutput);
    });
});
