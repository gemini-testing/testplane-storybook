import type { HermioneTestFunction } from "../../types";
import type { StorybookStoryExtended as StorybookStory } from "../get-stories";
import type { AssertViewOpts } from "hermione";

export type StorybookStoryExtended = StorybookStory & {
    skip: boolean;
    assertViewOpts: AssertViewOpts;
    browserIds: string[] | null;
    extraTests?: Record<string, HermioneTestFunction>;
};

export type ExecutionContextExtended = WebdriverIO.Browser["executionContext"] & {
    "hermione-storybook-assertView-opts": AssertViewOpts;
};

export type { StorybookStoryExtended as StorybookStory } from "../get-stories";
