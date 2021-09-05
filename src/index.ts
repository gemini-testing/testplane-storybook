import HermioneDecorator from "./addon/decorators/hermione";
import type { MakeDecoratorResult } from "@storybook/addons";

export * from "./types";
export const withHermione = (): MakeDecoratorResult => new HermioneDecorator().make();
