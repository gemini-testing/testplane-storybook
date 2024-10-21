import { isBoolean, isString, isNumber, isArray, isRegExp } from "lodash";
import { option, root, section, map } from "gemini-configparser";
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

const stringAndRegExpArrayOption = (name: string, defaultValue: string[]): Parser<string[]> =>
    option({
        defaultValue,
        validate: value => {
            const errorMessage = `"${name}" option must be an array of strings and regular expressions, but got`;

            if (!isArray(value)) {
                throw new Error(`${errorMessage} ${typeof value}`);
            }

            const nonStringIndex = value.findIndex(v => !isString(v) && !isRegExp(v));

            if (nonStringIndex !== -1) {
                throw new Error(`${errorMessage} ${typeof value[nonStringIndex]} at index ${nonStringIndex}`);
            }
        },
    });

export interface PluginConfig {
    enabled: boolean;
    storybookConfigDir: string;
    autoScreenshots: boolean;
    customAutoScreenshots: Record<string, { globals: Record<string, unknown>}>;
    localport: number;
    remoteStorybookUrl: string;
    browserIds: Array<string | RegExp>;
    unsafeAllowOtherTests: boolean;
}

export type PluginPartialConfig = Partial<PluginConfig>;

export function parseConfig(options: PluginPartialConfig): PluginConfig {
    const { env, argv } = process;

    const parseOptions = root<PluginConfig>(
        section({
            enabled: booleanOption("enabled", true),
            storybookConfigDir: stringOption("storybookConfigDir", ".storybook"),
            autoScreenshots: booleanOption("autoScreenshots", true),
            customAutoScreenshots: map(section({
                globals: section({
                    theme: stringOption("theme", ""),
                }),
            })),
            localport: numberOption("localport", 6006),
            remoteStorybookUrl: stringOption("remoteStorybookUrl", ""),
            browserIds: stringAndRegExpArrayOption("browserIds", []),
            unsafeAllowOtherTests: booleanOption("unsafeAllowOtherTests", false),
        }),
        { envPrefix: "testplane_storybook_", cliPrefix: "--storybook-" },
    );

    return parseOptions({ options, env, argv });
}
