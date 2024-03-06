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

type StorybookWindow = Window &
    typeof globalThis & {
        __HERMIONE_OPEN_STORY__: (storyId: string, remountOnly: boolean, done: (result: string) => void) => void;
        __STORYBOOK_ADDONS_CHANNEL__: EventEmitter;
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
    shouldRemount: boolean,
): Promise<StoryLoadResult> {
    const getResult = (): Promise<StoryLoadResult> =>
        browser.executeAsync(executeOpenStoryScript, storyId, shouldRemount).then(JSON.parse);

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

function openStoryScript(storyId: string, shouldRemount: boolean, done: (result: string) => void): void {
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

        channel.once("playFunctionThrewException", onPlayFunctionThrewException);
        channel.once("storyRendered", onStoryRendered);
        channel.once("storyMissing", onStoryMissing);
        channel.once("storyThrewException", onStoryThrewException);
        channel.once("storyErrored", onStoryErrored);

        if (shouldRemount) {
            channel.emit("setCurrentStory", { storyId: "" });
        }

        channel.emit("setCurrentStory", { storyId });
    });
}

function executeOpenStoryScript(storyId: string, remountOnly: boolean, done: (result: string) => void): void {
    if ((window as StorybookWindow).__HERMIONE_OPEN_STORY__) {
        (window as StorybookWindow).__HERMIONE_OPEN_STORY__(storyId, remountOnly, done);
    } else {
        done(JSON.stringify({ notInjected: true }));
    }
}
