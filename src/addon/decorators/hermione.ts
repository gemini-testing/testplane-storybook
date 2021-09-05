import Events from "@storybook/core-events";
import { addons, makeDecorator } from "@storybook/addons";
import { isUndefined, isEmpty } from "lodash";
import EnhancedPromise from "../utils/enhanced-promise";
import { PARAMETER_NAME, NON_EXISTENT_STORY_ID } from "../constants";

import type { MakeDecoratorResult, Channel, Args } from "@storybook/addons";
import type { SelectStoryStorybook, StoryRenderError } from "../../types";

declare global {
    interface Window {
        __HERMIONE_SELECT_STORY__: SelectStoryStorybook;
    }
}

export default class HermioneDecorator {
    private channel: Channel;
    private name: string;
    private currentStoryId: string;

    constructor() {
        this.channel = addons.getChannel();
        this.name = "withHermione";
        this.currentStoryId = "";
    }

    public make(): MakeDecoratorResult {
        this.exposeApi();

        return makeDecorator({
            name: this.name,
            parameterName: PARAMETER_NAME,
            wrapper: (getStory, context) => getStory(context),
        });
    }

    public async selectStory(storyId: string, args?: Args, callback?: (result?: unknown) => void): Promise<void> {
        const storyPromise = new EnhancedPromise<void>();

        try {
            if (this.currentStoryId === storyId) {
                await this.resetStory();
            } else {
                this.currentStoryId = storyId;
            }

            this.subscribeOnStoryEvents(storyPromise);
            this.channel.emit(Events.SET_CURRENT_STORY, { storyId });

            await storyPromise.done();

            if (!isUndefined(args) && !isEmpty(args)) {
                await this.updateStoryArgs(storyId, args);
            }

            callback && callback();
        } finally {
            this.unsubscribeFromStoryEvents(storyPromise);
        }
    }

    private exposeApi(): void {
        window.__HERMIONE_SELECT_STORY__ = this.selectStory.bind(this);
    }

    private resetStory(): Promise<void> {
        return new Promise(resolve => {
            this.channel.once(Events.STORY_MISSING, resolve);
            this.channel.emit(Events.SET_CURRENT_STORY, { storyId: NON_EXISTENT_STORY_ID });
        });
    }

    private updateStoryArgs(storyId: string, args: Args): Promise<void> {
        return new Promise(resolve => {
            this.channel.once(Events.STORY_ARGS_UPDATED, resolve);
            this.channel.emit(Events.UPDATE_STORY_ARGS, { storyId, updatedArgs: args });
        });
    }

    private subscribeOnStoryEvents(promise: EnhancedPromise<void>): void {
        this.channel.once(Events.STORY_RENDERED, this.storyRenderHandler(promise));
        this.channel.once(Events.STORY_ERRORED, this.storyErrorHandler(promise));
        this.channel.once(Events.STORY_THREW_EXCEPTION, this.storyExceptionHandler(promise));
    }

    private unsubscribeFromStoryEvents(promise: EnhancedPromise<void>): void {
        this.channel.off(Events.STORY_RENDERED, this.storyRenderHandler(promise));
        this.channel.off(Events.STORY_ERRORED, this.storyErrorHandler(promise));
        this.channel.off(Events.STORY_THREW_EXCEPTION, this.storyExceptionHandler(promise));
    }

    private storyRenderHandler(promise: EnhancedPromise<void>): () => void {
        return () => {
            promise.resolve();
        };
    }

    private storyErrorHandler(promise: EnhancedPromise<void>): (renderErr: StoryRenderError) => void {
        return ({ title, description }) => {
            const err = new Error(`title: ${title}, description: ${description}`);
            promise.reject(err);
        };
    }

    private storyExceptionHandler(promise: EnhancedPromise<void>): (err: Error) => void {
        return err => {
            promise.reject(err);
        };
    }
}
