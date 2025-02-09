import type { AssertViewOpts } from "testplane";
import type { TestplaneTestFunction } from "../../types";
import type { StorybookStoryExtended as StorybookStory } from "../get-stories";
import type { Inheritable } from "./inheritable-values";

export type AutoScreenshotStorybookGlobals = Record<string, null | Record<string, unknown>>;

export interface StorybookStoryExtraProperties {
    skip: boolean;
    assertViewOpts: Inheritable<AssertViewOpts>;
    browserIds: Array<string | RegExp> | null;
    extraTests: Record<string, TestplaneTestFunction> | null;
    autoScreenshots: boolean | null;
    autoscreenshotSelector: string | null;
    autoScreenshotStorybookGlobals: Inheritable<AutoScreenshotStorybookGlobals>;
}

export interface StorybookStoryExtended extends StorybookStory, Omit<StorybookStoryExtraProperties, "assertViewOpts"> {
    assertViewOpts: AssertViewOpts;
}

export type ExecutionContextExtended = WebdriverIO.Browser["executionContext"] & {
    "@testplane/storybook-assertView-opts": AssertViewOpts;
};

export type { StorybookStoryExtended as StorybookStory } from "../get-stories";
