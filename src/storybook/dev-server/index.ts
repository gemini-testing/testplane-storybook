import { spawn } from "child_process";
import npmWhich from "npm-which";
import logger from "../../logger";
import { pipeWithPrefix } from "./pipe-with-prefix";
import { isPortBusy } from "./is-port-busy";
import type { ChildProcessWithoutNullStreams } from "child_process";
import type Hermione from "hermione";

const getStorybookCliPath = (): string => {
    try {
        const startStorybookPath = npmWhich.sync("start-storybook", { cwd: process.cwd() });

        logger.warn("found 'start-storybook' binary, launching storybook@6 dev server");

        return startStorybookPath;
    } catch (_) {
        try {
            return npmWhich.sync("storybook", { cwd: process.cwd() });
        } catch (_) {
            throw new Error("'storybook' and 'start-storybook' binaries are not found");
        }
    }
};

const getStorybookDevServerArgs = (port: number, storybookConfigDir: string): string[] => [
    "dev",
    "-p",
    String(port),
    "-c",
    String(storybookConfigDir),
    "--ci",
    "--quiet",
    "--disable-telemetry",
];

export const getStorybookDevServer = async (
    hermione: Hermione,
    port: number,
    storybookConfigDir: string,
): Promise<ChildProcessWithoutNullStreams> => {
    if (await isPortBusy(port)) {
        throw new Error(`Can't launch storybook dev server: port '${port}' is already in use`);
    }

    const storybookCliPath = getStorybookCliPath();
    const devServer = spawn(storybookCliPath, getStorybookDevServerArgs(port, storybookConfigDir), {
        cwd: process.cwd(),
    });

    logger.log(`Started storybook dev server at http://localhost:${port}`);

    pipeWithPrefix(devServer, "[storybook dev server] ");

    devServer.once("exit", code => {
        if (code === 1) {
            hermione.halt(new Error("An error occured while launching storybook dev server"), 5000);
        }
    });

    return devServer;
};
