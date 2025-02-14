import { extractInheritedValue, inheritValue } from "./inheritable-values";

type TestingObject = { foo: number; bar: number; baz: number };
type DeepObject = { foo: number; bar: { baz: number[] } };
type InheritedFn<T> = (base: T) => T;

describe("storybook/story-test-runner/inheritable-values", () => {
    describe("inheritValue", () => {
        it("should return overlayed value with objects", () => {
            const firstObject = { foo: 4 } as TestingObject;
            const secondObject = { bar: 6 } as TestingObject;
            const thirdObject = { baz: 8 } as TestingObject;
            const fourthObject = { bar: 10 } as TestingObject;

            const inheritedValue = inheritValue(firstObject, secondObject, thirdObject, fourthObject);

            expect(inheritedValue).toEqual({ foo: 4, bar: 10, baz: 8 });
        });

        it("should return overlayed value with mixed objects and functions", () => {
            const baseObject = { foo: 4 } as TestingObject;
            const extendObjectFn: InheritedFn<TestingObject> = baseObj => ({ ...baseObj, bar: 8 });

            const inheritedValueFn = inheritValue(baseObject, extendObjectFn);
            const inheritedValue = (inheritedValueFn as InheritedFn<TestingObject>)({} as TestingObject);

            expect(inheritedValue).toEqual({ foo: 4, bar: 8 });
        });

        it("should not mutate objects", () => {
            const firstObject = { foo: 4 } as TestingObject;
            const secondObject = { bar: 6 } as TestingObject;
            const thirdObject = { bar: 8 } as TestingObject;

            inheritValue(firstObject, secondObject, thirdObject);

            expect(firstObject).toEqual({ foo: 4 });
            expect(secondObject).toEqual({ bar: 6 });
            expect(thirdObject).toEqual({ bar: 8 });
        });

        it("should not mutate objects deeply even if they are mutated directly by functions", () => {
            const baseObject = { bar: { baz: [1, 2, 3] } } as DeepObject;
            const mutateFn: InheritedFn<DeepObject> = baseObj => {
                baseObj.foo = 4;
                baseObj.bar.baz[1] = 100500;

                return baseObj;
            };

            const inheritedValueFn = inheritValue(baseObject, mutateFn);
            const inheritedValue = (inheritedValueFn as InheritedFn<DeepObject>)({} as DeepObject);

            expect(inheritedValue).toEqual({ foo: 4, bar: { baz: [1, 100500, 3] } });
            expect(baseObject).toEqual({ bar: { baz: [1, 2, 3] } });
        });
    });

    describe("extractInheritedValue", () => {
        it("should extract inherited value", () => {
            const baseValue = { foo: 4 } as TestingObject;
            const overlayedValue = { bar: 6 } as TestingObject;

            const inheritedValue = inheritValue(baseValue, overlayedValue);
            const resultValue = extractInheritedValue(inheritedValue, { foo: 8, baz: 10 } as TestingObject);

            expect(resultValue).toEqual({ foo: 4, bar: 6, baz: 10 });
        });

        it("should extract inherited function", () => {
            const initialValue = { foo: 100, baz: 10 } as TestingObject;
            const baseValue = { foo: 4 } as TestingObject;
            const mutateFn: InheritedFn<TestingObject> = baseObj => {
                baseObj.foo *= 2;
                baseObj.baz *= 2;

                return baseObj;
            };

            const inheritedValue = inheritValue(baseValue, mutateFn);
            const resultValue = extractInheritedValue(inheritedValue, initialValue);

            expect(resultValue).toEqual({ foo: 8, baz: 20 });
        });
    });
});
