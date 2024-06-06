import type { AssertViewOpts } from "testplane";
import type { TestplaneTestFunction } from "../../types";
import type { StorybookStoryExtended as StorybookStory } from "../get-stories";

export interface StorybookStoryExtended extends StorybookStory {
    skip: boolean;
    assertViewOpts: AssertViewOpts;
    browserIds: Array<string | RegExp> | null;
    extraTests?: Record<string, TestplaneTestFunction>;
    autoscreenshotSelector: string | null;
}

export type ExecutionContextExtended = WebdriverIO.Browser["executionContext"] & {
    "@testplane/storybook-assertView-opts": AssertViewOpts;
};

export type { StorybookStoryExtended as StorybookStory } from "../get-stories";
