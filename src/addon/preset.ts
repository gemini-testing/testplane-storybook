export function previewAnnotations(entry: unknown[] = []): unknown[] {
    return [...entry, require.resolve("./decorators")];
}
