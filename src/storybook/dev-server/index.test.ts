import { getStorybookDevServer } from "./index";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import npmWhich from "npm-which";
import logger from "../../logger";
import { isPortBusy } from "./is-port-busy";
import type Testplane from "testplane";

jest.mock("child_process");
jest.mock("npm-which");
jest.mock("./pipe-with-prefix");
jest.mock("./is-port-busy");
jest.mock("../../logger");

describe("storybook/dev-server", () => {
    const testplaneMock = { halt: jest.fn() } as unknown as Testplane;
    const devServerMock = { once: jest.fn(), stdout: null, stderr: null };

    beforeEach(() => {
        jest.mocked(spawn).mockReturnValue(devServerMock as unknown as ChildProcessWithoutNullStreams);
        jest.mocked(isPortBusy).mockResolvedValue(false);
        jest.mocked(npmWhich.sync).mockReturnValue("/path/to/storybook");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should start the storybook dev server", async () => {
        await getStorybookDevServer(testplaneMock, 6006, ".storybook");

        expect(spawn).toHaveBeenCalledWith(
            "/path/to/storybook",
            ["dev", "-p", "6006", "-c", ".storybook", "--ci", "--quiet", "--disable-telemetry"],
            { cwd: process.cwd() },
        );
        expect(logger.log).toHaveBeenCalledWith("Started storybook dev server at http://localhost:6006");
    });

    it("should halt testplane if the dev server exits with an error", async () => {
        const expectedErrorMessage = [
            "An error occured while launching storybook dev server",
            "Dev server failed with code '1' (signal: SIGHUP)",
        ].join("\n");
        await getStorybookDevServer(testplaneMock, 6006, ".storybook");

        const exitCallback = devServerMock.once.mock.calls[0][1];
        exitCallback(1, "SIGHUP");

        expect(testplaneMock.halt).toHaveBeenCalledWith(new Error(expectedErrorMessage), 5000);
    });

    it("should throw an error if port is busy", async () => {
        const expectedError = new Error("Can't launch storybook dev server: port '6006' is already in use");

        jest.mocked(isPortBusy).mockResolvedValue(true);

        await expect(() => getStorybookDevServer(testplaneMock, 6006, ".storybook")).rejects.toThrowError(
            expectedError,
        );
    });

    it("should throw an error if the storybook binaries are not found", async () => {
        const expectedErrorMessage = [
            "'storybook' and 'start-storybook' binaries are not found",
            "Please make sure you are launching Testplane tests from project root directory",
        ].join("\n");
        const expectedError = new Error(expectedErrorMessage);

        jest.mocked(npmWhich.sync).mockImplementation(() => {
            throw new Error("module not found");
        });

        await expect(() => getStorybookDevServer(testplaneMock, 6006, ".storybook")).rejects.toThrowError(
            expectedError,
        );
    });
});
