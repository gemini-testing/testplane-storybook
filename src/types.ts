import type { AssertViewOpts } from "testplane";

export type TestFunctionExtendedCtx = TestFunctionCtx & { expect: ExpectWebdriverIO.Expect };

export type TestplaneTestFunction = (
    this: TestFunctionExtendedCtx,
    ctx: TestFunctionExtendedCtx,
) => void | Promise<void>;

interface StorybookMetaConfig {
    component?: unknown;
}

interface CustomField<K> {
    testplane?: K;
}

type Combined<N, B = void> = B extends void ? N : N & B;

export type TestplaneMetaConfig<T = void> = Combined<
    CustomField<{
        skip?: boolean;
        assertViewOpts?: AssertViewOpts;
        browserIds?: Array<string | RegExp>;
        autoscreenshotSelector?: string;
    }>,
    T
>;

export type TestplaneStoryConfig<T = void> = Combined<CustomField<Record<string, TestplaneTestFunction>>, T>;

export type WithTestplane<T = void> = T extends StorybookMetaConfig ? TestplaneMetaConfig<T> : TestplaneStoryConfig<T>;
