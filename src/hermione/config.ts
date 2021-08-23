import { isBoolean, isString } from "lodash";
import { option, root, section } from "gemini-configparser";
import type { Parser } from "gemini-configparser";

const assertType = <T>(name: string, validationFn: (v: unknown) => boolean, type: string) => {
    return (v: T) => {
        if (!validationFn(v)) {
            throw new Error(`"${name}" option must be a ${type}, but got ${typeof v}`);
        }
    };
};

const booleanOption = (name: string, defaultValue = false): Parser<boolean> =>
    option({
        parseEnv: (val: string) => Boolean(JSON.parse(val)),
        parseCli: (val: string) => Boolean(JSON.parse(val)),
        defaultValue,
        validate: assertType<boolean>(name, isBoolean, "boolean"),
    });

const stringOption = (name: string, defaultValue = ""): Parser<string> =>
    option({
        defaultValue,
        validate: assertType<string>(name, isString, "string"),
    });

export type PluginConfig = {
    enabled: boolean;
    storybookUrl: string;
};

export type PluginPartialConfig = Partial<PluginConfig>;

export function parseConfig(options: PluginPartialConfig): PluginConfig {
    const { env, argv } = process;

    const parseOptions = root<PluginConfig>(
        section({
            enabled: booleanOption("enabled", true),
            storybookUrl: stringOption("storybookUrl", "http://localhost:6006"),
        }),
        { envPrefix: "hermione_storybook_", cliPrefix: "--storybook-" },
    );

    return parseOptions({ options, env, argv });
}
