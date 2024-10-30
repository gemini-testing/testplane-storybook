import HermioneDecorator from "./addon/decorators/hermione";
import type { makeDecorator } from "@storybook/preview-api";

export * from "./types";
export const withHermione = (): ReturnType<typeof makeDecorator> => new HermioneDecorator().make();
