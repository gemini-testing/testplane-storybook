import logger from "../../../logger";
import { extractStoriesV3 } from "./v3";
import { StorybookIndexJson, extractStoriesV4 } from "./v4";
import { extractStories } from "./index";

jest.mock("../../../logger");

jest.mock("./v3");
jest.mock("./v4");

describe("get-stories/extract-stories", () => {
    const loggerMock = jest.mocked(logger);
    const extractStoriesV3Mock = jest.mocked(extractStoriesV3);
    const extractStoriesV4Mock = jest.mocked(extractStoriesV4);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should call logger.warn when an unsupported version is provided", () => {
        const storiesJson = { v: 6 as unknown, entries: {} } as StorybookIndexJson;

        extractStories(storiesJson);

        expect(loggerMock.warn).toHaveBeenCalledTimes(3);
        expect(loggerMock.warn.mock.calls[0][0]).toEqual("Unsupported version of stories json");
        expect(loggerMock.warn.mock.calls[1][0]).toEqual("'3, 4, 5' expected, but 6 found");
        expect(loggerMock.warn.mock.calls[2][0]).toEqual("I'll try to do my best with it! (acting like it's v4)");
    });

    it("should fallback to extractStoriesV4 when the version does not match", () => {
        const storiesJson = { v: 5 as unknown, entries: {} } as StorybookIndexJson;

        extractStories(storiesJson);

        expect(extractStoriesV3Mock).not.toHaveBeenCalled();
        expect(extractStoriesV4Mock).toHaveBeenCalledWith(storiesJson);
    });

    it("should call extractStoriesV3 when the version is 3", () => {
        const storiesJson = { v: 3 as const, stories: {} };

        extractStories(storiesJson);

        expect(extractStoriesV4Mock).not.toHaveBeenCalled();
        expect(extractStoriesV3Mock).toHaveBeenCalledWith(storiesJson);
    });
});
