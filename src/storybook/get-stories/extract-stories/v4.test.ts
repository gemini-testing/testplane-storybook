import { extractStoriesV4 } from "./v4";

describe("storybook/get-stories/extract-stories/v4", () => {
    it('should return only entries with type "story"', () => {
        const dataJson = {
            v: 4 as const,
            entries: {
                story1: {
                    id: "1",
                    title: "example/story1",
                    importPath: "./story1.story.ts",
                    name: "story1",
                    type: "story",
                },
                entry2: {
                    id: "2",
                    title: "example/story2",
                    importPath: "./story2.story.ts",
                    name: "entry2",
                    type: "docs",
                },
            },
        };

        const expectedOutput = [
            {
                id: "1",
                title: "example/story1",
                importPath: "./story1.story.ts",
                name: "story1",
                type: "story",
            },
        ];

        const result = extractStoriesV4(dataJson);
        expect(result).toEqual(expectedOutput);
    });
});
