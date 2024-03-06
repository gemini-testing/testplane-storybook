import path from "path";
import fs from "fs-extra";
import { getAbsoluteFilePath as getStoryRunnerAbsoluteFilePath } from "../story-test-runner";
import { StorybookStoryExtended } from "../get-stories";

export type HermioneOpts = {
    autoScreenshots: boolean;
};

type TestFileContent = {
    storyRunnerPath: string;
    stories: StorybookStoryExtended[];
    opts: HermioneOpts;
};

const getHermioneTestFileContent = ({ storyRunnerPath, stories, opts }: TestFileContent): string => `
const stories = ${JSON.stringify(stories)};
const storyTestRunnerPath = ${JSON.stringify(storyRunnerPath)};
const hermioneOpts = ${JSON.stringify(opts)};

require(storyTestRunnerPath).run(stories, hermioneOpts);
`;

export const writeStoryTestsFile = async ({
    testFile,
    stories,
    opts,
}: {
    testFile: string;
    stories: StorybookStoryExtended[];
    opts: HermioneOpts;
}): Promise<void> => {
    const storyRunnerPath = getStoryRunnerAbsoluteFilePath();
    const testFileContent = getHermioneTestFileContent({ storyRunnerPath, stories, opts });

    await fs.ensureDir(path.dirname(testFile));
    await fs.writeFile(testFile, testFileContent);
};
