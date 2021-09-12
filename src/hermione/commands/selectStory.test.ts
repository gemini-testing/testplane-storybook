/**
 * @jest-environment jsdom
 */
import P from "bluebird";
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
    let executeMock: jest.Mock<
        Promise<SelectStoryStorybook | void | undefined>,
        [script: (...args: unknown[]) => unknown, ...args: unknown[]]
    >;
    let executeAsyncMock: jest.Mock<Promise<void>, [script: (...args: unknown[]) => unknown, ...args: unknown[]]>;
    let executeAsyncCb: jest.SpyInstance;
    let waitUntilMock: jest.Mock<Promise<void>>;

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
        waitUntilMock = jest.fn().mockImplementation(() => waitUntilMock.mock.calls[0][0]());

        browser = {
            url: urlMock,
            getUrl: getUrlMock,
            setMeta: setMetaMock,
            execute: executeMock,
            executeAsync: executeAsyncMock,
            waitUntil: waitUntilMock,
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

    describe("'executeAsync' throws", () => {
        it("should not handle error if 'executeAsync' is supported in the browser", async () => {
            executeAsyncMock.mockImplementation(() => {
                throw new Error("some-error");
            });
            const selectStoryCmd = createSelectStory("/storybook/url");

            await expect(selectStoryCmd.call(browser, "story-id")).rejects.toMatchObject({
                message: "some-error",
            });
        });

        describe("handle error if 'executeAsync' is not supported in the browser", () => {
            beforeEach(() => {
                executeAsyncMock.mockImplementation(() => {
                    throw new Error("Method has not yet been implemented");
                });

                executeMock
                    .mockResolvedValueOnce(window.__HERMIONE_SELECT_STORY__)
                    .mockImplementation((_, storyId, args = {}) => {
                        return executeMock.mock.calls[1][0](storyId, args) as Promise<void>;
                    });

                (window.__HERMIONE_SELECT_STORY__ as jest.Mock).mockImplementation((...args) => {
                    return P.delay(10).then(args[args.length - 1]());
                });
            });

            test("should select story using addon api", async () => {
                const selectStoryCmd = createSelectStory("/storybook/url");
                const storyArgs: Args = { foo: "bar" };

                await selectStoryCmd.call(browser, "story-id", storyArgs);

                expect(executeMock).toHaveBeenNthCalledWith(2, expect.any(Function), "story-id", storyArgs);
                expect(window.__HERMIONE_SELECT_STORY__).toHaveBeenCalledWith(
                    "story-id",
                    storyArgs,
                    expect.any(Function),
                );
                expect(window.__HERMIONE_IS_STORY_RENDERED__).toBeTrue();
            });

            test("should wait until story is rendered", async () => {
                const selectStoryCmd = createSelectStory("/storybook/url");

                await selectStoryCmd.call(browser, "story-id");

                expect(waitUntilMock).toHaveBeenCalledAfter(executeMock);
                expect(waitUntilMock).toHaveBeenCalledWith(expect.any(Function), {
                    timeoutMsg: 'Story: "story-id" is not rendered',
                });
            });
        });
    });
});
