import path from "path";
import fs from "fs-extra";
import { getAbsoluteFilePath as getStoryRunnerAbsoluteFilePath } from "../story-test-runner";
import { StorybookStoryExtended } from "../get-stories";

export interface TestplaneOpts {
    autoScreenshots: boolean;
    autoscreenshotSelector: string;
    autoScreenshotStorybookGlobals: Record<string, Record<string, unknown>>;
}

interface TestFileContent {
    storyRunnerPath: string;
    stories: StorybookStoryExtended[];
    opts: TestplaneOpts;
}

const getTestplaneTestFileContent = ({ storyRunnerPath, stories, opts }: TestFileContent): string => `
const stories = ${JSON.stringify(stories)};
const storyTestRunnerPath = ${JSON.stringify(storyRunnerPath)};
const testplaneOpts = ${JSON.stringify(opts)};

require(storyTestRunnerPath).run(stories, testplaneOpts);
`;

export const writeStoryTestsFile = async ({
    testFile,
    stories,
    opts,
}: {
    testFile: string;
    stories: StorybookStoryExtended[];
    opts: TestplaneOpts;
}): Promise<void> => {
    const storyRunnerPath = getStoryRunnerAbsoluteFilePath();
    const testFileContent = getTestplaneTestFileContent({ storyRunnerPath, stories, opts });

    await fs.ensureDir(path.dirname(testFile));
    await fs.writeFile(testFile, testFileContent);
};
