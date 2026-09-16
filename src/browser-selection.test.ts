import path from "path";
import os from "os";
import fs from "fs-extra";
import { execFileSync } from "child_process";
import Testplane from "testplane";
import { patchTestplaneSets } from "./utils";

describe("browser selection", () => {
    let testDir: string;
    let testFile: string;

    beforeEach(() => {
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), "testplane-storybook-browser-selection-"));
        testFile = path.join(testDir, "stories.testplane.js");

        fs.writeFileSync(
            testFile,
            `
describe("stories", () => {
    testplane.only.in(["chrome"]);
    it("plugin default", () => {});

    testplane.only.in(["chrome", "firefox"]);
    it("expanded override", () => {});

    testplane.only.in(["firefox"]);
    it("narrowed override", () => {});
});
`,
        );
    });

    afterEach(() => {
        fs.removeSync(testDir);
    });

    const mkTestplane_ = (): Testplane => {
        const testplane = new Testplane({
            browsers: {
                chrome: { desiredCapabilities: {} },
                firefox: { desiredCapabilities: {} },
            },
        });

        patchTestplaneSets(testplane.config, { files: [testFile] });

        return testplane;
    };

    const readTests_ = (browsers?: string[]): string[] => {
        const testplane = mkTestplane_();
        const readerFile = path.join(testDir, "read-tests.js");
        const testplaneModulePath = require.resolve("testplane");

        fs.writeFileSync(
            readerFile,
            `
const Testplane = require(${JSON.stringify(testplaneModulePath)}).default;

(async () => {
    const testplane = new Testplane({
        browsers: {
            chrome: { desiredCapabilities: {} },
            firefox: { desiredCapabilities: {} },
        },
        sets: ${JSON.stringify(testplane.config.sets)},
    });
    const collection = await testplane.readTests([${JSON.stringify(testFile)}], {
        browsers: ${JSON.stringify(browsers)},
        silent: true,
    });
    const enabledTests = collection
        .mapTests((test, browserId) => ({ browserId, title: test.fullTitle(), disabled: test.disabled }))
        .filter(test => !test.disabled)
        .map(test => \`\${test.browserId}: \${test.title}\`);

    process.stdout.write(JSON.stringify(enabledTests));
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
`,
        );

        return JSON.parse(execFileSync(process.execPath, [readerFile], { encoding: "utf8" }));
    };

    it("should collect story overrides in every configured browser", () => {
        expect(readTests_()).toEqual([
            "chrome: stories plugin default",
            "chrome: stories expanded override",
            "firefox: stories expanded override",
            "firefox: stories narrowed override",
        ]);
    });

    it("should preserve an explicit CLI browser filter", () => {
        expect(readTests_(["firefox"])).toEqual([
            "firefox: stories expanded override",
            "firefox: stories narrowed override",
        ]);
    });
});
