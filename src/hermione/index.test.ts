import { when } from "jest-when";
import { createSelectStory } from "./commands/selectStory";
import { getHermioneMock, getPluginConfigMock } from "../__mocks__/hermione";
import plugin from "./";
import type Hermione from "hermione";

jest.mock("./config", () => ({ parseConfig: jest.fn(opts => opts) }));
jest.mock("./commands/selectStory");

describe("hermione-plugin/index", () => {
    let hermione: Hermione;
    let browser: WebdriverIO.Browser;
    let addCommandMock: jest.Mock<void, [string, (...args: unknown[]) => unknown]>;

    describe("master process", () => {
        beforeEach(() => {
            hermione = getHermioneMock({ isWorker: false });
            addCommandMock = jest.fn();
            browser = {
                addCommand: addCommandMock,
            } as unknown as WebdriverIO.Browser;
        });

        test("should do nothing if plugin is disabled", () => {
            plugin(hermione, getPluginConfigMock({ enabled: false }));

            expect(hermione.on).not.toHaveBeenCalled();
        });

        test("should do nothing if plugin is enabled", () => {
            plugin(hermione, getPluginConfigMock({ enabled: true }));

            expect(hermione.on).not.toHaveBeenCalled();
        });
    });

    describe("worker process", () => {
        beforeEach(() => {
            hermione = getHermioneMock({ isWorker: true });
        });

        test("should do nothing if plugin is disabled", () => {
            plugin(hermione, getPluginConfigMock({ enabled: false }));

            expect(hermione.on).not.toHaveBeenCalled();
        });

        describe("'NEW_BROWSER' event", () => {
            test("should subscribe", () => {
                plugin(hermione, getPluginConfigMock({ enabled: true }));

                expect(hermione.on).toHaveBeenCalledWith(hermione.events.NEW_BROWSER, expect.any(Function));
            });

            test("should add 'selectStory' command to the browser", () => {
                const storybookUrl = "/relative/url";
                const selectStoryCmd = jest.fn();
                when(createSelectStory).calledWith(storybookUrl).mockReturnValue(selectStoryCmd);

                plugin(hermione, getPluginConfigMock({ enabled: true, storybookUrl }));
                hermione.emit(hermione.events.NEW_BROWSER, browser);

                expect(addCommandMock).toHaveBeenCalledWith("selectStory", selectStoryCmd);
            });
        });
    });
});
