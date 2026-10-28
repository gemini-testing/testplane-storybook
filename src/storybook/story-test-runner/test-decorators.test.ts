import { extendedIt } from "./test-decorators";
import type { StorybookStoryExtended } from "./types";

describe("storybook/story-test-runner/test-decorators", () => {
    const originalIt = it;

    const mkStory_ = (browserIds: StorybookStoryExtended["browserIds"]): StorybookStoryExtended => {
        return { browserIds, skip: false } as StorybookStoryExtended;
    };

    const stubTestplaneGlobals_ = (): jest.Mock => {
        const onlyIn = jest.fn();

        Object.defineProperty(globalThis, "testplane", {
            configurable: true,
            value: { only: { in: onlyIn } },
        });
        Object.defineProperty(globalThis, "it", {
            configurable: true,
            value: jest.fn(),
        });

        return onlyIn;
    };

    afterEach(() => {
        Reflect.deleteProperty(globalThis, "testplane");
        Object.defineProperty(globalThis, "it", {
            configurable: true,
            value: originalIt,
        });
        jest.restoreAllMocks();
    });

    it("should use plugin browserIds as a default for a story without an override", () => {
        const onlyIn = stubTestplaneGlobals_();

        extendedIt(mkStory_(null), "test", jest.fn(), ["chrome"]);

        expect(onlyIn).toHaveBeenCalledWith(["chrome"]);
    });

    it("should let a story override narrow the plugin default", () => {
        const onlyIn = stubTestplaneGlobals_();

        extendedIt(mkStory_(["firefox"]), "test", jest.fn(), ["chrome", "firefox"]);

        expect(onlyIn).toHaveBeenCalledWith(["firefox"]);
    });

    it("should let a story override expand the plugin default", () => {
        const onlyIn = stubTestplaneGlobals_();

        extendedIt(mkStory_(["chrome", "firefox"]), "test", jest.fn(), ["chrome"]);

        expect(onlyIn).toHaveBeenCalledWith(["chrome", "firefox"]);
    });

    it("should not limit a story when plugin browserIds are empty", () => {
        const onlyIn = stubTestplaneGlobals_();

        extendedIt(mkStory_(null), "test", jest.fn(), null);

        expect(onlyIn).not.toHaveBeenCalled();
    });

    it("should select no browsers when a non-empty plugin default matches no configured browser", () => {
        const onlyIn = stubTestplaneGlobals_();

        extendedIt(mkStory_(null), "test", jest.fn(), []);

        expect(onlyIn).toHaveBeenCalledWith([]);
    });

    it("should preserve an explicitly empty story override", () => {
        const onlyIn = stubTestplaneGlobals_();

        extendedIt(mkStory_([]), "test", jest.fn(), ["chrome"]);

        expect(onlyIn).toHaveBeenCalledWith([]);
    });
});
