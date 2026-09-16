import { run } from ".";
import { extendStoriesFromStoryFile } from "./extend-stories";
import { nestedDescribe, extendedIt } from "./test-decorators";
import type { StorybookStory, StorybookStoryExtended } from "./types";

jest.mock("./extend-stories");
jest.mock("./test-decorators");

describe("storybook/story-test-runner", () => {
    it("should pass plugin browserIds to each generated story test", () => {
        const story = {
            autoScreenshots: true,
            autoScreenshotStorybookGlobals: {},
            browserIds: null,
            extraTests: null,
        } as StorybookStoryExtended;
        const browserIds = ["chrome"];

        jest.mocked(extendStoriesFromStoryFile).mockReturnValue([story]);
        jest.mocked(nestedDescribe).mockImplementation((_story, fn) => fn());

        run([story as StorybookStory], {
            autoScreenshots: true,
            autoscreenshotSelector: "",
            autoScreenshotStorybookGlobals: {},
            browserIds,
        });

        expect(extendedIt).toHaveBeenCalledWith(story, "Autoscreenshot", expect.any(Function), browserIds);
    });
});
