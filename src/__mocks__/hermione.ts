import { EventEmitter } from "events";
import type Hermione from "hermione";
import type { PluginConfig, PluginPartialConfig } from "../hermione/config";

export const getHermioneMock = (opts: { isWorker: boolean }): Hermione => {
    const hermione = new EventEmitter() as unknown as Hermione;

    hermione.isWorker = () => opts.isWorker;
    hermione.events = { NEW_BROWSER: "newBrowser" } as Hermione.EVENTS;
    jest.spyOn(hermione, "on");

    return hermione;
};

export const getPluginConfigMock = (opts: PluginPartialConfig = {}): PluginConfig => {
    return {
        enabled: true,
        storybookUrl: "https://default-storybook.com",
        ...opts,
    } as unknown as PluginConfig;
};
