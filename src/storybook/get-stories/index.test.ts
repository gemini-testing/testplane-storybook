import { getStories } from "./index";
import path from "path";
import { StorybookRawStory, extractStories } from "./extract-stories";
import { waitStorybookDataJson } from "./wait-storybook-data-json";

jest.mock("path");
jest.mock("./wait-storybook-data-json");

jest.mock("../../utils", () => ({
    getStorybookPathEndingWith: jest.fn().mockImplementation((path, ending) => path + ending),
}));

jest.mock("./extract-stories", () => ({
    extractStories: jest.fn().mockReturnValue([{}]),
    storybookDataJsonPaths: ["foo", "bar"],
}));

describe("storybook/get-stories", () => {
    it("should fetch storybook json data and return stories with absolute path", async () => {
        const storybookStory = { importPath: "import path" } as StorybookRawStory;
        const storybookStoryExtended = { ...storybookStory, absolutePath: "absolute path" };
        const waitStorybookJsonTimeout = 30_000;

        jest.mocked(path.resolve).mockReturnValue("absolute path");
        jest.mocked(extractStories).mockReturnValue([storybookStory]);

        const result = await getStories("storybookUrl/", waitStorybookJsonTimeout);

        expect(waitStorybookDataJson).toBeCalledWith(
            ["storybookUrl/foo", "storybookUrl/bar"],
            waitStorybookJsonTimeout,
        );
        expect(result).toEqual([storybookStoryExtended]);
    });

    it("should throw an error if no stories are found", async () => {
        const waitStorybookJsonTimeout = 30_000;

        jest.mocked(extractStories).mockReturnValue([]);

        await expect(getStories("storybookUrl/", waitStorybookJsonTimeout)).rejects.toThrow(
            "Couldn't find storybook stories",
        );
    });
});
