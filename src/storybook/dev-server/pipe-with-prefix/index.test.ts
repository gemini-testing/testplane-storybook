import { ChildProcessWithoutNullStreams } from "child_process";
import { Stream, pipeline } from "stream";
import { pipeWithPrefix } from "./index";
import logger from "../../../logger";

jest.mock("stream", () => ({
    pipeline: jest.fn(),
}));

jest.mock("../../../logger");

jest.mock("child_process");

jest.mock("stream", () => ({
    ...jest.requireActual("stream"),
    pipeline: jest.fn(),
}));

jest.mock("./with-prefix-transformer", () => ({
    WithPrefixTransformer: jest.fn(),
}));

describe("storybook/dev-server/pipe-with-prefix", () => {
    const mockedPipeline = jest.mocked(pipeline);
    const mockedLogger = jest.mocked(logger);
    const mockedPrefix = "Prefix: ";

    const mockedChildProcess: ChildProcessWithoutNullStreams = {
        stdout: new Stream.Readable(),
        stderr: new Stream.Readable(),
    } as ChildProcessWithoutNullStreams;

    it("should call pipeline twice", () => {
        pipeWithPrefix(mockedChildProcess, mockedPrefix);

        expect(mockedPipeline).toBeCalledTimes(2);
    });

    it("should call logger.error when pipeline callback is called with an error", () => {
        mockedPipeline.mockImplementationOnce((...args: any[]): any => {
            const callback: (error: Error) => void = args[args.length - 1];
            callback(new Error("Pipeline error"));
        });

        pipeWithPrefix(mockedChildProcess, mockedPrefix);
        expect(mockedLogger.error).toHaveBeenCalledWith(
            "Got an error, trying to pipeline dev server output:",
            "Pipeline error",
        );
    });
});
