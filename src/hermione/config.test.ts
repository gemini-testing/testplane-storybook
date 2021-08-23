import { parseConfig } from "./config";
import type { PluginPartialConfig } from "./config";

describe("hermione-plugin/config", () => {
    describe("'enabled' option", () => {
        test("should be enabled by default", () => {
            const options = {} as PluginPartialConfig;

            expect(parseConfig(options).enabled).toBeTruthy();
        });

        test("should throw if passed value is not a boolean", () => {
            const options = { enabled: "string" } as unknown as PluginPartialConfig;

            expect(() => parseConfig(options)).toThrow('"enabled" option must be a boolean, but got string');
        });

        test("should set passed value", () => {
            const options = { enabled: false } as PluginPartialConfig;

            expect(parseConfig(options).enabled).toBeFalsy();
        });
    });

    describe('"storybookUrl" option', () => {
        test("should has default url to storybook", () => {
            const options = {} as PluginPartialConfig;

            expect(parseConfig(options).storybookUrl).toBe("http://localhost:6006");
        });

        test("should throw if passed value is not a string", () => {
            const options = { storybookUrl: 12345 } as unknown as PluginPartialConfig;

            expect(() => parseConfig(options)).toThrow('"storybookUrl" option must be a string, but got number');
        });

        test("should set passed value", () => {
            const options = { storybookUrl: "http://some/url" } as PluginPartialConfig;

            expect(parseConfig(options).storybookUrl).toBe("http://some/url");
        });
    });
});
