/**
 * @jest-environment jsdom
 */
import { EventEmitter } from "events";
import P from "bluebird";
import Events from "@storybook/core-events";
import { addons, makeDecorator } from "@storybook/addons";
import HermioneDecorator from "./hermione";
import { NON_EXISTENT_STORY_ID } from "./../constants";
import "jest-extended";

import type { Channel, Args } from "@storybook/addons";
import type { StoryRenderError } from "../../types";

jest.mock("@storybook/addons");

const getChannelMock = (): Channel => {
    const channel = new EventEmitter() as unknown as Channel;

    jest.spyOn(channel, "emit");
    jest.spyOn(channel, "once");
    jest.spyOn(channel, "off");

    return channel;
};

describe("hermione-addon/hermione-decorator", () => {
    let hermioneDecorator: HermioneDecorator;
    let channel: Channel;

    beforeEach(() => {
        channel = getChannelMock();
        (addons.getChannel as jest.Mock).mockReturnValue(channel);
    });

    describe("'make' method", () => {
        test("should expose api", () => {
            new HermioneDecorator().make();

            expect(window.__HERMIONE_SELECT_STORY__).not.toBeUndefined();
        });

        test("should return result of call storybook 'makeDecorator", () => {
            (makeDecorator as jest.Mock).mockReturnValue("decorator");

            const result = new HermioneDecorator().make();

            expect(result).toBe("decorator");
        });
    });

    describe("'selectStory' method", () => {
        beforeEach(() => {
            hermioneDecorator = new HermioneDecorator();
            hermioneDecorator.make();
        });

        [Events.STORY_RENDERED, Events.STORY_ERRORED, Events.STORY_THREW_EXCEPTION].forEach(event => {
            test(`should subscribe once on ${event} event`, async () => {
                P.delay(10).then(() => channel.emit(Events.STORY_RENDERED));

                await hermioneDecorator.selectStory("story-id");

                expect(channel.once).toHaveBeenCalledWith(event, expect.any(Function));
            });

            describe(`should unsubscribe from ${event} event if story`, () => {
                test("rendered", async () => {
                    P.delay(10).then(() => channel.emit(Events.STORY_RENDERED));

                    await hermioneDecorator.selectStory("story-id");

                    expect(channel.off).toHaveBeenCalledWith(event, expect.any(Function));
                });

                test("thrown", async () => {
                    const err = new Error("o.O");
                    P.delay(10).then(() => channel.emit(Events.STORY_THREW_EXCEPTION, err));

                    try {
                        await hermioneDecorator.selectStory("story-id");
                    } catch (_) {
                        expect(channel.off).toHaveBeenCalledWith(event, expect.any(Function));
                    }
                });
            });
        });

        test("should emit 'SET_CURRENT_STORY' event with passed story id", async () => {
            P.delay(10).then(() => channel.emit(Events.STORY_RENDERED));

            await hermioneDecorator.selectStory("story-id");

            expect(channel.emit).toHaveBeenCalledWith(Events.SET_CURRENT_STORY, { storyId: "story-id" });
        });

        test("should call passed callback after story is rendered", async () => {
            const storyRendered = jest.fn();
            const callback = jest.fn();
            channel.on(Events.STORY_RENDERED, storyRendered);
            P.delay(10).then(() => channel.emit(Events.STORY_RENDERED));

            await hermioneDecorator.selectStory("story-id", {}, callback);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledAfter(storyRendered);
        });

        test("should throw if story errored", async () => {
            const err: StoryRenderError = { title: "some-title", description: "some-descr" };
            P.delay(10).then(() => channel.emit(Events.STORY_ERRORED, err));

            await expect(hermioneDecorator.selectStory("story-id")).rejects.toMatchObject({
                message: "title: some-title, description: some-descr",
            });
        });

        test("should throw if story throw exception", async () => {
            const err = new Error("o.O");
            P.delay(10).then(() => channel.emit(Events.STORY_THREW_EXCEPTION, err));

            await expect(hermioneDecorator.selectStory("story-id")).rejects.toMatchObject({
                message: "o.O",
            });
        });

        test("should reset story and its args if story is already rendered", async () => {
            P.delay(10)
                .then(() => channel.emit(Events.STORY_RENDERED))
                .then(() => P.delay(10).then(() => channel.emit(Events.STORY_MISSING)))
                .then(() => P.delay(10).then(() => channel.emit(Events.STORY_ARGS_UPDATED)))
                .then(() => P.delay(10).then(() => channel.emit(Events.STORY_RENDERED)));

            await hermioneDecorator.selectStory("story-id");
            await hermioneDecorator.selectStory("story-id");

            expect(channel.once).toHaveBeenCalledWith(Events.STORY_MISSING, expect.any(Function));
            expect(channel.emit).toHaveBeenCalledWith(Events.SET_CURRENT_STORY, { storyId: NON_EXISTENT_STORY_ID });

            expect(channel.once).toHaveBeenCalledWith(Events.STORY_ARGS_UPDATED, expect.any(Function));
            expect(channel.emit).toHaveBeenCalledWith(Events.RESET_STORY_ARGS, { storyId: "story-id" });
        });

        test("should update story args", async () => {
            const storyArgs: Args = { foo: "bar" };
            P.delay(10)
                .then(() => channel.emit(Events.STORY_RENDERED))
                .then(() =>
                    P.delay(10).then(() =>
                        channel.emit(Events.STORY_ARGS_UPDATED, { storyId: "story-id", args: storyArgs }),
                    ),
                );

            await hermioneDecorator.selectStory("story-id", storyArgs);

            expect(channel.once).toHaveBeenCalledWith(Events.STORY_ARGS_UPDATED, expect.any(Function));
            expect(channel.emit).toHaveBeenCalledWith(Events.UPDATE_STORY_ARGS, {
                storyId: "story-id",
                updatedArgs: storyArgs,
            });
        });

        test("should wait until all fonts loaded", async () => {
            const mediator = jest.fn();
            document.fonts = {
                ready: P.delay(100).then(mediator),
            };
            P.delay(10).then(() => channel.emit(Events.STORY_RENDERED));

            await hermioneDecorator.selectStory("story-id");

            expect(mediator).toHaveBeenCalled();
        });
    });

    test("should call 'selectStory' method on call addon api", () => {
        const hermioneDecorator = new HermioneDecorator();
        hermioneDecorator.selectStory = jest.fn();
        const storyArgs: Args = { foo: "bar" };
        const callback = jest.fn();

        hermioneDecorator.make();
        window.__HERMIONE_SELECT_STORY__("story-id", storyArgs, callback);

        expect(hermioneDecorator.selectStory).toHaveBeenCalledWith("story-id", storyArgs, callback);
    });
});
