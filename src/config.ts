import { isBoolean, isString, isNumber, isArray } from "lodash";
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

const numberOption = (name: string, defaultValue: number): Parser<number> =>
    option({
        defaultValue,
        validate: assertType<number>(name, isNumber, "number"),
    });

const stringOption = (name: string, defaultValue = ""): Parser<string> =>
    option({
        defaultValue,
        validate: assertType<string>(name, isString, "string"),
    });

const stringArrayOption = (name: string, defaultValue: string[]): Parser<string[]> =>
    option({
        defaultValue,
        validate: value => {
            const errorMessage = `"${name}" option must be an array of strings, but got`;

            if (!isArray(value)) {
                throw new Error(`${errorMessage} ${typeof value}`);
            }

            const nonStringIndex = value.findIndex(v => !isString(v));

            if (nonStringIndex !== -1) {
                throw new Error(`${errorMessage} ${typeof value[nonStringIndex]} at index ${nonStringIndex}`);
            }
        },
    });

export type PluginConfig = {
    enabled: boolean;
    storybookConfigDir: string;
    autoScreenshots: boolean;
    localport: number;
    remoteStorybookUrl: string;
    browserIds: string[];
};

export type PluginPartialConfig = Partial<PluginConfig>;

export function parseConfig(options: PluginPartialConfig): PluginConfig {
    const { env, argv } = process;

    const parseOptions = root<PluginConfig>(
        section({
            enabled: booleanOption("enabled", true),
            storybookConfigDir: stringOption("storybookConfigDir", ".storybook"),
            autoScreenshots: booleanOption("autoScreenshots", true),
            localport: numberOption("localport", 6006),
            remoteStorybookUrl: stringOption("remoteStorybookUrl", ""),
            browserIds: stringArrayOption("browserIds", []),
        }),
        { envPrefix: "hermione_storybook_", cliPrefix: "--storybook-" },
    );

    return parseOptions({ options, env, argv });
}
