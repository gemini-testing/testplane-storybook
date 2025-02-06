import type { AssertViewOpts } from "testplane";
import type { TestplaneTestFunction } from "../../types";
import type { StorybookStoryExtended as StorybookStory } from "../get-stories";

export interface StorybookStoryExtraProperties {
    skip: boolean;
    assertViewOpts: AssertViewOpts;
    browserIds: Array<string | RegExp> | null;
    extraTests: Record<string, TestplaneTestFunction> | null;
    autoScreenshots: boolean | null;
    autoscreenshotSelector: string | null;
    autoScreenshotStorybookGlobals: Record<string, Record<string, unknown>>;
}

export interface StorybookStoryExtended extends StorybookStory, StorybookStoryExtraProperties {}

export type ExecutionContextExtended = WebdriverIO.Browser["executionContext"] & {
    "@testplane/storybook-assertView-opts": AssertViewOpts;
};

export type { StorybookStoryExtended as StorybookStory } from "../get-stories";
