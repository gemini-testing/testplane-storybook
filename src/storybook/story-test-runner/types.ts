import type { AssertViewOpts } from "hermione";
import type { HermioneTestFunction } from "../../types";
import type { StorybookStoryExtended as StorybookStory } from "../get-stories";

export interface StorybookStoryExtended extends StorybookStory {
    skip: boolean;
    assertViewOpts: AssertViewOpts;
    browserIds: Array<string | RegExp> | null;
    extraTests?: Record<string, HermioneTestFunction>;
}

export type ExecutionContextExtended = WebdriverIO.Browser["executionContext"] & {
    "hermione-storybook-assertView-opts": AssertViewOpts;
};

export type { StorybookStoryExtended as StorybookStory } from "../get-stories";
