import type { AssertViewOpts } from "testplane";
import type { AutoScreenshotStorybookGlobals } from "./storybook/story-test-runner/types";
import type { Inheritable } from "./storybook/story-test-runner/inheritable-values";

export type TestFunctionExtendedCtx = TestFunctionCtx & { expect: ExpectWebdriverIO.Expect };

export type TestplaneTestFunction = (
    this: TestFunctionExtendedCtx,
    ctx: TestFunctionExtendedCtx,
) => void | Promise<void>;

interface StorybookMetaConfig {
    component?: unknown;
}

type Combined<N, B = void> = B extends void ? N : N & B;

type TestplaneStoryFileConfig = {
    skip?: boolean;
    assertViewOpts?: Inheritable<AssertViewOpts>;
    browserIds?: Array<string | RegExp>;
    autoScreenshots?: boolean;
    autoscreenshotSelector?: string;
    autoScreenshotStorybookGlobals?: Inheritable<AutoScreenshotStorybookGlobals>;
};

export type TestplaneMetaConfig<T = void> = Combined<
    {
        /**
         * @deprecated Use "testplaneConfig" instead of "testplane"
         */
        testplane?: TestplaneStoryFileConfig;
        testplaneConfig?: TestplaneStoryFileConfig;
    },
    T
>;

export type TestplaneStoryConfig<T = void> = Combined<
    {
        testplane?: Record<string, TestplaneTestFunction>;
        testplaneConfig?: TestplaneStoryFileConfig;
    },
    T
>;

export type WithTestplane<T = void> = T extends StorybookMetaConfig ? TestplaneMetaConfig<T> : TestplaneStoryConfig<T>;
