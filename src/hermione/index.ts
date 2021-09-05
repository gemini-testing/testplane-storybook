import { parseConfig } from "./config";
import { createSelectStory } from "./commands/selectStory";
import type Hermione from "hermione";
import type { PluginPartialConfig } from "./config";

export = (hermione: Hermione, options: PluginPartialConfig): void => {
    const { enabled, storybookUrl } = parseConfig(options);

    if (!enabled || !hermione.isWorker()) {
        return;
    }

    hermione.on(hermione.events.NEW_BROWSER, browser => {
        browser.addCommand("selectStory", createSelectStory(storybookUrl));
    });
};
