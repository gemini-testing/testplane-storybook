import type Hermione from "hermione";
import type EventEmitter from "events";
import type { ChildProcessWithoutNullStreams } from "child_process";
import { parseConfig } from "./config";
import { STORYBOOK_IFRAME_PATH } from "./constants";
import { getStorybookPathEndingWith } from "./utils";
import { getStories } from "./storybook/get-stories";
import { buildStoryTestFiles } from "./storybook/story-to-test";
import { patchHermioneBaseUrl, patchHermioneSets, disableHermioneIsolation } from "./utils";
import { getStorybookDevServer } from "./storybook/dev-server";
import type { PluginConfig, PluginPartialConfig } from "./config";
import type { ExecutionContextExtended } from "./storybook/story-test-runner/types";

type HtmlReporterApi = {
    gui?: EventEmitter & {
        events: {
            SERVER_INIT: string;
        };
    };
};

type HandlerSharedData = {
    isGui: boolean;
    devServer: ChildProcessWithoutNullStreams | null;
};

export * from "./types";

export { getStoryFile } from "./storybook/story-to-test";

export default (hermione: Hermione, opts: PluginPartialConfig): void => {
    const config = parseConfig(opts);

    if (!config.enabled || !process.argv.includes("--storybook")) {
        return;
    }

    if (hermione.isWorker()) {
        onHermioneWorker(hermione);
    } else {
        onHermioneMaster(hermione, config);
    }
};

function onHermioneWorker(hermione: Hermione): void {
    hermione.on(hermione.events.NEW_BROWSER, async browser => {
        const commandName = "assertView";

        const withStoryDefaults = (opts = {}): Record<string, unknown> => {
            const executionContext = browser.executionContext as ExecutionContextExtended;

            return {
                ...(executionContext["hermione-storybook-assertView-opts"] || {}),
                ...opts,
            };
        };

        browser.overwriteCommand(commandName, (baseAssertView, name, selector, opts = {}, ...rest) => {
            return baseAssertView(name, selector, withStoryDefaults(opts), ...rest);
        });

        browser.overwriteCommand(
            commandName,
            (baseAssertView, name, opts = {}, ...rest) => {
                return baseAssertView(name, withStoryDefaults(opts), ...rest);
            },
            true,
        );
    });
}

function onHermioneMaster(hermione: Hermione, config: PluginConfig): void {
    const sharedData: HandlerSharedData = { isGui: false, devServer: null };

    hermione.on(hermione.events.CLI, commander => {
        commander.option("--storybook", "run Storybook tests");

        const hermioneWithHtmlReporter = hermione as Hermione & HtmlReporterApi;

        hermioneWithHtmlReporter.gui?.on(hermioneWithHtmlReporter.gui.events.SERVER_INIT, async () => {
            sharedData.isGui = true;
        });
    });

    hermione.on(hermione.events.INIT, async () => {
        const isLocal = !config.remoteStorybookUrl;

        if (isLocal) {
            sharedData.devServer = await getStorybookDevServer(hermione, config.localport, config.storybookConfigDir);
        }

        const storybookUrl = isLocal ? `http://127.0.0.1:${config.localport}` : config.remoteStorybookUrl;
        const iframeUrl = getStorybookPathEndingWith(storybookUrl, STORYBOOK_IFRAME_PATH);

        const stories = await getStories(storybookUrl);

        const storyTestFiles = await buildStoryTestFiles(stories, { autoScreenshots: config.autoScreenshots });

        patchHermioneBaseUrl(hermione.config, iframeUrl);
        patchHermioneSets(hermione.config, config.browserIds, storyTestFiles);
        disableHermioneIsolation(hermione.config, config.browserIds);
    });

    hermione.on(hermione.events.AFTER_TESTS_READ, testCollection => {
        testCollection.eachTest(test => {
            if (test.skipReason === "Skipped by mocha interface") {
                test.skipReason = "Skipped in storybook file";
            }
        });
    });

    hermione.on(hermione.events.EXIT, () => {
        sharedData.devServer?.kill("SIGKILL");
    });

    hermione.on(hermione.events.RUNNER_END, () => {
        if (!sharedData.isGui) {
            sharedData.devServer?.kill("SIGKILL");
        }
    });
}
