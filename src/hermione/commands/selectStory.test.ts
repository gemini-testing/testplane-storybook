/**
 * @jest-environment jsdom
 */
import { createSelectStory } from "./selectStory";
import { STORYBOOK_PREVIEW } from "../constants";
import "jest-extended";
import type { Args } from "@storybook/addons";
import type { SelectStoryStorybook } from "../../types";

describe("hermione-plugin/selectStory", () => {
    let browser: WebdriverIO.Browser;
    let urlMock: jest.Mock<Promise<void>, [string]>;
    let getUrlMock: jest.Mock<Promise<string>, []>;
    let setMetaMock: jest.Mock<Promise<void>, [string, unknown]>;
    let executeMock: jest.Mock<Promise<SelectStoryStorybook | undefined>, [script: (...args: unknown[]) => unknown]>;
    let executeAsyncMock: jest.Mock<Promise<void>, [script: (...args: unknown[]) => unknown, ...args: unknown[]]>;
    let executeAsyncCb: jest.SpyInstance;

    beforeEach(() => {
        urlMock = jest.fn<Promise<void>, [string]>().mockResolvedValue();
        getUrlMock = jest.fn().mockResolvedValue("/default/url");
        setMetaMock = jest.fn<Promise<void>, [string, unknown]>().mockResolvedValue();
        executeMock = jest.fn().mockImplementation(() => executeMock.mock.calls[0][0]());
        executeAsyncMock = jest
            .fn()
            .mockImplementation((_, storyId, args = {}) =>
                executeAsyncMock.mock.calls[0][0](storyId, args, executeAsyncCb),
            );

        browser = {
            url: urlMock,
            getUrl: getUrlMock,
            setMeta: setMetaMock,
            execute: executeMock,
            executeAsync: executeAsyncMock,
        } as unknown as WebdriverIO.Browser;

        window.__HERMIONE_SELECT_STORY__ = jest.fn() as unknown as SelectStoryStorybook;
    });

    describe("'selectStory' is called on storybook page with inited hermione-addon", () => {
        test("should check that addon api is available", async () => {
            const selectStoryCmd = createSelectStory("/storybook/url");

            await selectStoryCmd.call(browser, "story-id");

            expect(executeMock).toHaveBeenCalledTimes(1);
        });

        test("should not try to get current url before select story", async () => {
            const selectStoryCmd = createSelectStory("/storybook/url");

            await selectStoryCmd.call(browser, "story-id");

            expect(getUrlMock).not.toHaveBeenCalledBefore(executeAsyncMock);
        });

        test("should select story using addon api", async () => {
            const selectStoryCmd = createSelectStory("/storybook/url");
            const storyArgs: Args = { foo: "bar" };

            await selectStoryCmd.call(browser, "story-id", storyArgs);

            expect(executeAsyncMock).toHaveBeenCalledWith(expect.any(Function), "story-id", storyArgs);
            expect(window.__HERMIONE_SELECT_STORY__).toHaveBeenCalledWith("story-id", storyArgs, executeAsyncCb);
            expect(executeAsyncMock).toHaveBeenCalledAfter(executeMock);
        });

        test("should modify 'url' in meta with new url after select story", async () => {
            const newUrl = `/storybook/url/${STORYBOOK_PREVIEW}?id=story-id`;
            getUrlMock.mockResolvedValue(newUrl);
            const selectStoryCmd = createSelectStory("/storybook/url");

            await selectStoryCmd.call(browser, "story-id");

            expect(getUrlMock).toHaveBeenCalledAfter(executeAsyncMock);
            expect(setMetaMock).toHaveBeenCalledWith("url", newUrl);
        });
    });

    describe("'selectStory' is called on storybook page without hermione-addon", () => {
        beforeEach(() => {
            executeMock.mockResolvedValue(undefined);
        });

        test(`should throw if current page is matched to storybook url with "${STORYBOOK_PREVIEW}"`, async () => {
            const selectStoryCmd = createSelectStory(`/storybook/url/${STORYBOOK_PREVIEW}`);
            getUrlMock.mockResolvedValue(`/storybook/url/${STORYBOOK_PREVIEW}`);

            await expect(selectStoryCmd.call(browser, "story-id")).rejects.toMatchObject({
                message: "Hermione addon is not connected to storybook config",
            });
        });
    });

    describe("'selectStory' is called on not storybook page", () => {
        beforeEach(() => {
            executeMock.mockResolvedValue(undefined);
        });

        test("should try to get current url", async () => {
            const selectStoryCmd = createSelectStory("/storybook/url");

            await selectStoryCmd.call(browser, "story-id");

            expect(getUrlMock).toHaveBeenCalledAfter(executeMock);
            expect(getUrlMock).toHaveBeenCalledBefore(executeAsyncMock);
        });

        test("should open storybook url on preview iframe after get the current one", async () => {
            const selectStoryCmd = createSelectStory("/storybook/url");

            await selectStoryCmd.call(browser, "story-id");

            expect(urlMock).toHaveBeenCalledWith(`/storybook/url/${STORYBOOK_PREVIEW}`);
            expect(urlMock).toHaveBeenCalledAfter(getUrlMock);
        });

        test(`should correctly open storybook url which contains "${STORYBOOK_PREVIEW}"`, async () => {
            const selectStoryCmd = createSelectStory(`/storybook/url/${STORYBOOK_PREVIEW}`);

            await selectStoryCmd.call(browser, "story-id");

            expect(urlMock).toHaveBeenCalledWith(`/storybook/url/${STORYBOOK_PREVIEW}`);
        });

        test("should select story using addon api after open storybook url", async () => {
            const selectStoryCmd = createSelectStory("/storybook/url");
            const storyArgs: Args = { foo: "bar" };

            await selectStoryCmd.call(browser, "story-id", storyArgs);

            expect(executeAsyncMock).toHaveBeenCalledWith(expect.any(Function), "story-id", storyArgs);
            expect(window.__HERMIONE_SELECT_STORY__).toHaveBeenCalledWith("story-id", storyArgs, executeAsyncCb);
            expect(executeAsyncMock).toHaveBeenCalledAfter(urlMock);
        });

        test("should modify 'url' in meta with new url after select story", async () => {
            const newUrl = `/storybook/url/${STORYBOOK_PREVIEW}?id=story-id`;
            getUrlMock.mockResolvedValueOnce("/not-storybook/url").mockResolvedValueOnce(newUrl);
            const selectStoryCmd = createSelectStory("/storybook/url");

            await selectStoryCmd.call(browser, "story-id");

            expect(setMetaMock).toHaveBeenCalledWith("url", newUrl);
        });
    });
});
