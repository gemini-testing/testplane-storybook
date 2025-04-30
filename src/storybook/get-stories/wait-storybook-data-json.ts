import { STORYBOOK_SERVER_REQUEST_TIMEOUT, STORYBOOK_SERVER_CHECK_INTERVAL } from "../../constants";
import logger from "../../logger";
import type { StorybookDataJson } from "./extract-stories";

export const waitStorybookDataJson = async (
    storybookJsonUrls: string[],
    waitStorybookJsonTimeout: number,
    fetch = globalThis.fetch,
): Promise<StorybookDataJson> => {
    let isSuccess = false;
    let isError = false;

    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
            if (!isSuccess) {
                isError = true;
                reject(
                    new Error(
                        [
                            `Couldn't obtain stories JSON data in ${waitStorybookJsonTimeout}ms`,
                            'If you are using Storybook v6, please make sure you have set "features.buildStoriesJson" to "true" in your "./.storybook/main.js" file.',
                            `If your storybook dev server can't start in ${waitStorybookJsonTimeout}ms, you can increase "waitStorybookJsonTimeout" value in the config`,
                        ].join("\n"),
                    ),
                );
            }
        }, waitStorybookJsonTimeout).unref();
    });

    const storybookReadyPromise = new Promise<StorybookDataJson>(resolve => {
        const waitForResource = (resourceUrl: string): void => {
            const tryToFetch = (): void => {
                const signal = AbortSignal.timeout(STORYBOOK_SERVER_REQUEST_TIMEOUT);

                fetch(resourceUrl, { signal })
                    .then(res => res.text())
                    .then(text => JSON.parse(text))
                    .then(data => {
                        if (!isError && !isSuccess) {
                            isSuccess = true;
                            resolve(data);
                        }
                    })
                    .catch((err: { cause?: { code: string } }) => {
                        if (!isError && !isSuccess) {
                            setTimeout(tryToFetch, STORYBOOK_SERVER_CHECK_INTERVAL);

                            const errorMessage = err && err.cause && (err.cause.code || err.cause);

                            if (errorMessage && errorMessage !== "ECONNREFUSED") {
                                logger.warn("Fetching stories json failed:", errorMessage);
                            }
                        }
                    });
            };

            tryToFetch();
        };

        storybookJsonUrls.forEach(waitForResource);
    });

    return Promise.race([timeoutPromise, storybookReadyPromise]);
};
