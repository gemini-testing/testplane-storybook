import { encodeStoryPath, decodeStoryPath } from "./story-test-file-path";

describe("storybook/story-to-test/story-test-file-path", () => {
    describe("encodeStoryPath", () => {
        it("should return path unchanged if it does not contain '../'", () => {
            expect(encodeStoryPath("foo/bar/baz")).toBe("foo/bar/baz");
        });

        it("should encode leading '../'", () => {
            expect(encodeStoryPath("../foo/bar")).toBe("_TP-SB-BACK_/foo/bar");
        });

        it("should encode '/../' in the middle of the path", () => {
            expect(encodeStoryPath("foo/../bar")).toBe("foo/_TP-SB-BACK_/bar");
        });

        it("should encode multiple '/../' occurrences in the middle", () => {
            expect(encodeStoryPath("foo/../bar/../baz")).toBe("foo/_TP-SB-BACK_/bar/_TP-SB-BACK_/baz");
        });

        it("should encode both leading '../' and '/../' in the middle", () => {
            expect(encodeStoryPath("../foo/../bar")).toBe("_TP-SB-BACK_/foo/_TP-SB-BACK_/bar");
        });
    });

    describe("decodeStoryPath", () => {
        it("should return path unchanged if it does not contain encoded segments", () => {
            expect(decodeStoryPath("foo/bar/baz")).toBe("foo/bar/baz");
        });

        it("should decode leading '_TP-SB-BACK_/'", () => {
            expect(decodeStoryPath("_TP-SB-BACK_/foo/bar")).toBe("../foo/bar");
        });

        it("should decode '/_TP-SB-BACK_/' in the middle of the path", () => {
            expect(decodeStoryPath("foo/_TP-SB-BACK_/bar")).toBe("foo/../bar");
        });

        it("should decode multiple '/_TP-SB-BACK_/' occurrences in the middle", () => {
            expect(decodeStoryPath("foo/_TP-SB-BACK_/bar/_TP-SB-BACK_/baz")).toBe("foo/../bar/../baz");
        });

        it("should decode both leading '_TP-SB-BACK_/' and '/_TP-SB-BACK_/' in the middle", () => {
            expect(decodeStoryPath("_TP-SB-BACK_/foo/_TP-SB-BACK_/bar")).toBe("../foo/../bar");
        });
    });

    describe("encode/decode roundtrip", () => {
        it("should return original path after encode then decode", () => {
            const paths = ["foo/bar", "../foo/bar", "foo/../bar", "../foo/../bar/../baz"];

            for (const p of paths) {
                expect(decodeStoryPath(encodeStoryPath(p))).toBe(p);
            }
        });
    });
});
