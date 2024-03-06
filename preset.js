"use strict";

export function config() {
    const errorMessage = [
        "hermione-storybook: the functionality of the plugin was significantly changed",
        "Continue using v0 or read about new hermione-storybook at https://github.com/gemini-testing/hermione-storybook"
    ].join("\n");

    throw new Error(errorMessage);
};
