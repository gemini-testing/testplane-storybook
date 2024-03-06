import type { TestFunctionExtendedCtx } from "../../types";
import type { StorybookStoryExtended } from "./types";

export function nestedDescribe(story: StorybookStoryExtended, fn: () => void): void {
    const pathSegments = story.title.split("/").concat(story.name).reverse();

    const describeCallback = pathSegments.reduce((acc, val) => {
        return function () {
            describe(val, acc);
        };
    }, fn);

    describeCallback();
}

export function extendedIt<T extends Partial<TestFunctionExtendedCtx>>(
    story: StorybookStoryExtended,
    testName: string,
    cb: TestFunction<T>,
): void {
    const skipableIt = (story.skip ? it.skip : it) as typeof it;

    story.browserIds && hermione.only.in(story.browserIds);

    skipableIt(testName, cb);
}
