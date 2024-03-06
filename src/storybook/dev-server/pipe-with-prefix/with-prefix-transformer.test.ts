import { TransformCallback } from "stream";
import { WithPrefixTransformer } from "./with-prefix-transformer";

const green = (text: string): string => `\x1B[32m${text}\x1B[39m`;

describe("storybook/dev-server/pipe-with-prefix/with-prefix-tranformer", () => {
    const prefix = "Prefix";
    const transformCbMock: TransformCallback = jest.fn();

    let transformer: WithPrefixTransformer;
    let transformerPushSpy: jest.SpyInstance;

    beforeEach(() => {
        transformer = new WithPrefixTransformer(prefix);
        transformerPushSpy = jest.spyOn(transformer, "push");
    });

    it("should set the correct initial properties", () => {
        expect(transformer.prefix).toBe(green(prefix));
        expect(transformer.includePrefix).toBe(true);
    });

    it("should call the callback", () => {
        transformer._transform("Chunk", "utf8", transformCbMock);

        expect(transformCbMock).toHaveBeenCalled();
    });

    describe("should transform chunk of data", () => {
        it("should add prefix to first row", () => {
            transformer._transform("Row", "utf8", transformCbMock);

            expect(transformerPushSpy).toHaveBeenCalledWith(`${green("Prefix")}Row`);
        });

        it("should not add prefix to other chunks in a row", () => {
            transformer._transform("First chunk", "utf8", transformCbMock);
            transformer._transform("Other chunk", "utf8", transformCbMock);

            expect(transformerPushSpy).toHaveBeenCalledWith("Other chunk");
        });

        it("should not add prefix to empty line", () => {
            transformer._transform("First row\n", "utf8", transformCbMock);

            expect(transformerPushSpy).toHaveBeenCalledWith(`${green("Prefix")}First row\n`);
        });

        it("should add prefix to second line in other chunk", () => {
            transformer._transform("First row\n", "utf8", transformCbMock);
            transformer._transform("Second row", "utf8", transformCbMock);

            expect(transformerPushSpy).toHaveBeenCalledWith(`${green("Prefix")}Second row`);
        });

        it("should add prefix to all rows in a chunk", () => {
            transformer._transform("First\nSecond\nThird", "utf8", transformCbMock);

            expect(transformerPushSpy).toHaveBeenCalledWith(
                `${green("Prefix")}First\n${green("Prefix")}Second\n${green("Prefix")}Third`,
            );
        });
    });
});
