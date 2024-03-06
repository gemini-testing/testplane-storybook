import { parseConfig, PluginConfig } from "./config";

describe("config", () => {
    it("should return default values if no options are provided", () => {
        const expectedConfig: PluginConfig = {
            enabled: true,
            storybookConfigDir: ".storybook",
            autoScreenshots: true,
            localport: 6006,
            remoteStorybookUrl: "",
            browserIds: [],
        };

        expect(parseConfig({})).toMatchObject(expectedConfig);
    });

    it("should override default values with provided options", () => {
        const options: Partial<PluginConfig> = {
            enabled: false,
            storybookConfigDir: "custom-dir",
            autoScreenshots: false,
            localport: 1234,
            remoteStorybookUrl: "http://localhost:3000",
            browserIds: ["chrome", "firefox"],
        };
        const expectedConfig: PluginConfig = { ...options } as PluginConfig;

        expect(parseConfig(options)).toMatchObject(expectedConfig);
    });

    it("should throw an error if invalid browserIds are provided", () => {
        const options = { browserIds: ["foo", "bar", 42, "baz"] } as Partial<PluginConfig>;

        expect(() => parseConfig(options)).toThrowError(
            '"browserIds" option must be an array of strings, but got number at index 2',
        );
    });
});
