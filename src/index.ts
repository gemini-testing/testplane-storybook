import type Testplane from "testplane";
import type { ChildProcessWithoutNullStreams } from "child_process";
import { parseConfig } from "./config";
import { STORYBOOK_IFRAME_PATH } from "./constants";
import { getStorybookPathEndingWith } from "./utils";
import { getStories } from "./storybook/get-stories";
import { buildStoryTestFiles } from "./storybook/story-to-test";
import { patchTestplaneBaseUrl, patchTestplaneSets, patchSystemExtensions, disableTestplaneIsolation } from "./utils";
import { getStorybookDevServer } from "./storybook/dev-server";
import type { PluginConfig, PluginPartialConfig } from "./config";
import type { ExecutionContextExtended } from "./storybook/story-test-runner/types";

interface HandlerSharedData {
    devServer: ChildProcessWithoutNullStreams | null;
}

export * from "./types";

export { getStoryFile } from "./storybook/story-to-test";

export default (testplane: Testplane, opts: PluginPartialConfig): void => {
    const config = parseConfig(opts);

    if (!config.enabled || !process.argv.includes("--storybook")) {
        return;
    }

    if (testplane.isWorker()) {
        onTestplaneWorker(testplane);
    } else {
        onTestplaneMaster(testplane, config);
    }
};

function onTestplaneWorker(testplane: Testplane): void {
    testplane.on(testplane.events.NEW_BROWSER, async browser => {
        const commandName = "assertView";

        const withStoryDefaults = (opts = {}): Record<string, unknown> => {
            const executionContext = browser.executionContext as ExecutionContextExtended;

            return {
                ...(executionContext["@testplane/storybook-assertView-opts"] || {}),
                ...opts,
            };
        };

        browser.overwriteCommand(commandName, (baseAssertView, name, selector, opts = {}, ...rest: []) => {
            return baseAssertView(name, selector, withStoryDefaults(opts), ...rest);
        });

        browser.overwriteCommand(
            commandName,
            (baseAssertView, name, opts = {}, ...rest: []) => {
                return baseAssertView(name, withStoryDefaults(opts), ...rest);
            },
            true,
        );
    });
}

function onTestplaneMaster(testplane: Testplane, config: PluginConfig): void {
    const sharedData: HandlerSharedData = { devServer: null };

    testplane.on(testplane.events.CLI, commander => {
        commander.option("--storybook", "run storybook tests");
    });

    testplane.on(testplane.events.INIT, async () => {
        const isLocal = !config.remoteStorybookUrl;

        if (isLocal) {
            sharedData.devServer = await getStorybookDevServer(testplane, config.localport, config.storybookConfigDir);
        }

        const storybookUrl = isLocal ? `http://127.0.0.1:${config.localport}` : config.remoteStorybookUrl;
        const iframeUrl = getStorybookPathEndingWith(storybookUrl, STORYBOOK_IFRAME_PATH);

        const stories = await getStories(storybookUrl);

        const storyTestFiles = await buildStoryTestFiles(stories, { autoScreenshots: config.autoScreenshots });

        patchTestplaneBaseUrl(testplane.config, iframeUrl);
        disableTestplaneIsolation(testplane.config, config.browserIds);
        patchSystemExtensions(testplane.config);
        patchTestplaneSets(testplane.config, {
            browserIds: config.browserIds,
            files: storyTestFiles,
            unsafeAllowOtherTests: config.unsafeAllowOtherTests,
        });
    });

    testplane.on(testplane.events.AFTER_TESTS_READ, testCollection => {
        testCollection.eachTest(test => {
            if (test.skipReason === "Skipped by mocha interface") {
                test.skipReason = "Skipped in storybook file";
            }
        });
    });

    process.on("exit", async () => {
        sharedData.devServer?.kill("SIGKILL");
    });
}
