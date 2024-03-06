import type { AssertViewOpts } from "hermione";

export type TestFunctionExtendedCtx = TestFunctionCtx & { expect: ExpectWebdriverIO.Expect };

export type HermioneTestFunction = (
    this: TestFunctionExtendedCtx,
    ctx: TestFunctionExtendedCtx,
) => void | Promise<void>;

type StorybookMetaConfig = { component?: unknown };

type CustomField<K> = { hermione?: K };

type Combined<N, B = void> = B extends void ? N : N & B;

export type HermioneMetaConfig<T = void> = Combined<
    CustomField<{
        skip?: boolean;
        assertViewOpts?: AssertViewOpts;
        browserIds?: string[];
    }>,
    T
>;

export type HermioneStoryConfig<T = void> = Combined<CustomField<Record<string, HermioneTestFunction>>, T>;

export type WithHermione<T = void> = T extends StorybookMetaConfig ? HermioneMetaConfig<T> : HermioneStoryConfig<T>;
