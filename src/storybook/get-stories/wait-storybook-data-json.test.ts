import logger from "../../logger";
import { waitStorybookDataJson } from "./wait-storybook-data-json";

jest.mock("../../logger");

jest.mock("../../constants", () => ({
    STORYBOOK_SERVER_REQUEST_TIMEOUT: 5,
    STORYBOOK_SERVER_CHECK_INTERVAL: 1,
}));

const STORYBOOK_WAIT_SERVER_TIMEOUT = 15;

describe("storybook/get-stories/wait-storybook-data-json", () => {
    const textPromiseMock = jest.fn().mockResolvedValue(JSON.stringify({ foo: "bar" }));
    const fetchResolveMock = { text: textPromiseMock };
    const fetchRejectMock = { cause: { code: "ECONNREFUSED" } };

    it("should fetch data from multiple given urls", async () => {
        const fetchMock = jest.fn().mockImplementation((url: string) => {
            if (url === "https://bar.com") {
                return Promise.resolve(fetchResolveMock);
            }

            return Promise.reject(fetchRejectMock);
        });

        const result = await waitStorybookDataJson(
            ["https://foo.com", "https://bar.com"],
            STORYBOOK_WAIT_SERVER_TIMEOUT,
            fetchMock,
        );

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(result).toEqual({ foo: "bar" });
    });

    it("should reject if it exceeds the timeout", async () => {
        const fetchMock = jest.fn().mockReturnValue(new Promise(resolve => setTimeout(resolve, 16)));
        const errorMessage = [
            `Couldn't obtain stories JSON data in ${STORYBOOK_WAIT_SERVER_TIMEOUT}ms`,
            'If you are using Storybook v6, please make sure you have set "features.buildStoriesJson" to "true" in your "./.storybook/main.js" file.',
            `If your storybook dev server can't start in ${STORYBOOK_WAIT_SERVER_TIMEOUT}ms, you can increase "waitStorybookJsonTimeout" value in the config`,
        ].join("\n");

        const result = waitStorybookDataJson(["https://foo.com"], STORYBOOK_WAIT_SERVER_TIMEOUT, fetchMock);

        await expect(result).rejects.toThrowError(errorMessage);
    });

    it("should refetch, if fetch fails", async () => {
        const fetchMock = jest.fn().mockRejectedValueOnce(fetchRejectMock).mockResolvedValue(fetchResolveMock);

        await waitStorybookDataJson(["https://foo.com"], STORYBOOK_WAIT_SERVER_TIMEOUT, fetchMock);

        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("should abort request and refetch on fetch timeout", async () => {
        const onSignalAbortMock = jest.fn();
        const fetchMock = jest
            .fn()
            .mockImplementationOnce(
                (_, { signal }: { signal: AbortSignal }) =>
                    new Promise((_, reject) => {
                        signal.addEventListener("abort", () => {
                            onSignalAbortMock();
                            reject(fetchRejectMock);
                        });
                    }),
            )
            .mockResolvedValue(fetchResolveMock);

        await waitStorybookDataJson(["https://foo.com"], STORYBOOK_WAIT_SERVER_TIMEOUT, fetchMock);

        expect(onSignalAbortMock).toHaveBeenCalled();
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("should log an error, if it is not 'ECONNREFUSED'", async () => {
        const fetchRejectMock = { cause: { code: "ECONNRESET" } };
        const fetchMock = jest.fn().mockRejectedValueOnce(fetchRejectMock).mockResolvedValue(fetchResolveMock);

        await waitStorybookDataJson(["https://foo.com"], STORYBOOK_WAIT_SERVER_TIMEOUT, fetchMock);

        expect(logger.warn).toBeCalledWith("Fetching stories json failed:", "ECONNRESET");
    });
});
