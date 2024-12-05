import path from "path";
import fs from "fs-extra";
import { writeStoryTestsFile } from "./write-tests-file";
import { getAbsoluteFilePath as getStoryRunnerAbsoluteFilePath } from "../story-test-runner";
import { StorybookStoryExtended } from "../get-stories";

jest.mock("../story-test-runner");

jest.mock("fs-extra", () => ({
    ensureDir: jest.fn().mockReturnValue(Promise.resolve()),
    writeFile: jest.fn().mockReturnValue(Promise.resolve()),
}));

describe("storybook/story-to-test/write-tests-file", () => {
    it("should write test file with correct content", async () => {
        const stories = [{ id: "foo" }, { id: "bar" }] as StorybookStoryExtended[];
        const storyTestRunnerPath = "/absolute/story/runner/path";
        const testplaneOpts = {
            autoScreenshots: true,
            autoscreenshotSelector: ".foobar",
            autoScreenshotStorybookGlobals: { foo: { bar: "baz" } },
        };

        const testFile = "/absolute/test/path/file.testplane.js";

        const expectedContents = `
const stories = ${JSON.stringify(stories)};
const storyTestRunnerPath = ${JSON.stringify(storyTestRunnerPath)};
const testplaneOpts = ${JSON.stringify(testplaneOpts)};

require(storyTestRunnerPath).run(stories, testplaneOpts);
`;
        jest.mocked(getStoryRunnerAbsoluteFilePath).mockReturnValue(storyTestRunnerPath);

        await writeStoryTestsFile({
            testFile,
            stories,
            opts: testplaneOpts,
        });

        expect(getStoryRunnerAbsoluteFilePath).toHaveBeenCalled();
        expect(fs.ensureDir).toHaveBeenCalledWith(path.dirname(testFile));
        expect(fs.writeFile).toHaveBeenCalledWith(testFile, expectedContents);
    });
});
