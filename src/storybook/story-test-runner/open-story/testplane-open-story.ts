import type EventEmitter from "events";

export interface StoryLoadResult {
    rootSelector: string;
    playFunctionError?: string;
    loadError?: string;
    notInjected?: true;
}

interface HTMLElement {
    innerText: string;
}

export type StorybookWindow = Window &
    typeof globalThis & {
        __HERMIONE_OPEN_STORY__: (
            storyId: string,
            storybookGlobals: Record<string, unknown>,
            remountOnly: boolean,
            done: (result: string) => void,
        ) => void;
        __TESTPLANE_STORYBOOK_INITIAL_GLOBALS__?: Record<string, unknown>;
        __STORYBOOK_PREVIEW__?: { storeInitializationPromise?: Promise<void> };
        __STORYBOOK_ADDONS_CHANNEL__: EventEmitter & {
            data?: { setGlobals?: Array<{ globals: Record<string, unknown> }> };
        };
        __STORYBOOK_ADDON_INTERACTIONS_INSTRUMENTER_STATE__: Record<
            string,
            {
                calls: Array<{
                    exception?: {
                        message: string;
                    };
                }>;
            }
        >;
    };

export async function inject(browser: WebdriverIO.Browser): Promise<void> {
    await browser.execute(`window.__HERMIONE_OPEN_STORY__ = ${openStoryScript.toString()}`);
}

export async function execute(
    browser: WebdriverIO.Browser,
    storyId: string,
    storybookGlobals: Record<string, unknown>,
    shouldRemount: boolean,
): Promise<StoryLoadResult> {
    const getResult = (): Promise<StoryLoadResult> =>
        browser.executeAsync(executeOpenStoryScript, storyId, storybookGlobals, shouldRemount).then(JSON.parse);

    const result: StoryLoadResult = await getResult();

    if (!result.notInjected) {
        return result;
    }

    await inject(browser);

    const retriedResult = await getResult();

    if (retriedResult.notInjected) {
        throw new Error("Can't inject client script");
    }

    return retriedResult;
}

export default { inject, execute };

function openStoryScript(
    storyId: string,
    storybookGlobals: Record<string, unknown>,
    shouldRemount: boolean,
    done: (result: string) => void,
): void {
    function onPageLoad(fn: () => void): void {
        if (document.readyState === "complete") {
            fn();
        } else {
            document.onreadystatechange = function () {
                if (document.readyState === "complete") {
                    fn();
                }
            };
        }
    }

    onPageLoad(function () {
        const channel = (window as StorybookWindow).__STORYBOOK_ADDONS_CHANNEL__;
        const result: StoryLoadResult = { rootSelector: "" };

        function doneJson(value: StoryLoadResult): void {
            channel.off("playFunctionThrewException", onPlayFunctionThrewException);
            channel.off("storyRendered", onStoryRendered);
            channel.off("storyMissing", onStoryMissing);
            channel.off("storyThrewException", onStoryThrewException);
            channel.off("storyErrored", onStoryErrored);
            channel.off("globalsUpdated", onGlobalsUpdated);

            done(JSON.stringify(value));
        }

        function onPlayFunctionThrewException(): void {
            result.playFunctionError = "an unknown exception was thrown";
        }

        function onStoryRendered(): void {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            result.rootSelector = ["#storybook-root", "#root"].find(function (selector) {
                return document.querySelector(selector);
            })!;

            if (result.playFunctionError) {
                const instrumenter = (window as StorybookWindow).__STORYBOOK_ADDON_INTERACTIONS_INSTRUMENTER_STATE__;
                const storyState = instrumenter ? instrumenter[storyId] : null;
                const storyLastCall =
                    storyState && storyState.calls ? storyState.calls[storyState.calls.length - 1] : null;

                if (storyLastCall && storyLastCall.exception) {
                    result.playFunctionError = storyLastCall.exception.message;
                }
            }

            doneJson(result);
        }

        function onStoryMissing(storyId: string): void {
            if (storyId === "") {
                return;
            }

            const errorMessage = (document.querySelector("#error-stack") as unknown as HTMLElement).innerText;
            const regExpMatch = /\w+:\s+x\s+/.exec(errorMessage);

            if (regExpMatch) {
                result.loadError = errorMessage.slice(regExpMatch[0].length);
            } else {
                result.loadError = errorMessage;
            }

            doneJson(result);
        }

        function onStoryThrewException(exception: Error): void {
            if (exception.message && !exception.message.startsWith("ignoredException")) {
                result.loadError = exception.message;

                doneJson(result);
            }
        }

        function onStoryErrored(error: { title: string }): void {
            result.loadError = error.title;

            doneJson(result);
        }

        function onGlobalsUpdated(): void {
            channel.once("playFunctionThrewException", onPlayFunctionThrewException);
            channel.once("storyRendered", onStoryRendered);
            channel.once("storyMissing", onStoryMissing);
            channel.once("storyThrewException", onStoryThrewException);
            channel.once("storyErrored", onStoryErrored);

            if (shouldRemount) {
                channel.emit("setCurrentStory", { storyId: "" });
            }

            channel.emit("setCurrentStory", { storyId });
        }

        if (!channel) {
            result.loadError = "Couldn't find storybook channel. Looks like the opened page is not storybook preview";

            doneJson(result);
        }

        const storybookPreview = (window as StorybookWindow).__STORYBOOK_PREVIEW__;
        const isStorybookPreviewAvailable = storybookPreview && storybookPreview.storeInitializationPromise;
        const shouldUpdateStorybookGlobals = storybookGlobals && isStorybookPreviewAvailable;

        if (shouldUpdateStorybookGlobals) {
            (storybookPreview.storeInitializationPromise as Promise<void>).then(function () {
                let defaultGlobals = (window as StorybookWindow).__TESTPLANE_STORYBOOK_INITIAL_GLOBALS__;

                if (!defaultGlobals) {
                    const setGlobalCalls = (window as StorybookWindow).__STORYBOOK_ADDONS_CHANNEL__.data?.setGlobals;
                    const initValue = (setGlobalCalls && setGlobalCalls[0].globals) || {};

                    defaultGlobals = (window as StorybookWindow).__TESTPLANE_STORYBOOK_INITIAL_GLOBALS__ = initValue;
                }

                channel.once("globalsUpdated", onGlobalsUpdated);

                channel.emit("updateGlobals", { globals: Object.assign({}, defaultGlobals, storybookGlobals) });
            });
        } else {
            onGlobalsUpdated();
        }
    });
}

function executeOpenStoryScript(
    storyId: string,
    storybookGlobals: Record<string, unknown>,
    remountOnly: boolean,
    done: (result: string) => void,
): void {
    if ((window as StorybookWindow).__HERMIONE_OPEN_STORY__) {
        (window as StorybookWindow).__HERMIONE_OPEN_STORY__(storyId, storybookGlobals, remountOnly, done);
    } else {
        done(JSON.stringify({ notInjected: true }));
    }
}
