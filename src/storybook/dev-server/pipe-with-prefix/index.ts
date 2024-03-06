import { pipeline } from "stream";
import type { ChildProcessWithoutNullStreams } from "child_process";
import { WithPrefixTransformer } from "./with-prefix-transformer";
import logger from "../../../logger";

export const pipeWithPrefix = (childProcess: ChildProcessWithoutNullStreams, prefix: string): void => {
    const logOnErrorCb = (error: Error | null): void => {
        if (error) {
            logger.error("Got an error, trying to pipeline dev server output:", error.message);
        }
    };

    pipeline(childProcess.stdout, new WithPrefixTransformer(prefix), process.stdout, logOnErrorCb);
    pipeline(childProcess.stderr, new WithPrefixTransformer(prefix), process.stderr, logOnErrorCb);
};
