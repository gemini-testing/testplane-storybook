// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Inheritable<T extends Record<any, any>> = T | ((baseValue: T) => T);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isFunc = (obj?: unknown): obj is (...args: any[]) => any => typeof obj === "function";

// Acts like "Object.assign", but:
// - Does not mutate arguments
// - Supports functions (previousValue) => nextValue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function inheritValue<T extends Record<any, any>>(
    ...values: Array<undefined | Inheritable<T>>
): undefined | Inheritable<T> {
    let resultValue = values[0];

    for (let i = 1; i < values.length; i++) {
        const prevValue = resultValue;
        const curValue = values[i];

        if (!curValue) {
            continue;
        }

        if (!resultValue) {
            resultValue = curValue;
        }

        if (!isFunc(prevValue) && !isFunc(curValue)) {
            resultValue = Object.assign({}, prevValue, curValue);
        } else if (isFunc(prevValue) && isFunc(curValue)) {
            resultValue = (baseValue: T) => curValue(prevValue(structuredClone(baseValue)));
        } else if (isFunc(prevValue) && !isFunc(curValue)) {
            resultValue = (baseValue: T) => Object.assign({}, prevValue(structuredClone(baseValue)), curValue);
        } else if (!isFunc(prevValue) && isFunc(curValue)) {
            resultValue = (baseValue: T) => curValue(structuredClone(Object.assign({}, baseValue, prevValue)));
        }
    }

    return resultValue;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractInheritedValue<T extends Record<any, any>>(value: undefined | Inheritable<T>, baseValue: T): T {
    if (!value) {
        return baseValue;
    }

    return typeof value === "function" ? value(baseValue) : structuredClone(Object.assign({}, baseValue, value));
}
