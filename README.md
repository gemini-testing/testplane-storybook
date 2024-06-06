# @testplane/storybook

A Testplane plugin that makes it easy to write [Testplane](https://github.com/gemini-testing/testplane) tests on [storybook](https://github.com/storybookjs/storybook) components:
- Adds automatic screenshot tests for storybook stories;
- Adds an ability to write Testplane tests for storybook stories right inside of the stories.

## Installation

```bash
npm install @testplane/storybook --save-dev
```

## Usage

> ⚠️ Storybook 6.4+ is required to use this plugin.

### Storybook

If you use storybook@6, you will need to enable [buildStoriesJson](https://storybook.js.org/docs/6.4/configure/overview#feature-flags) feature in your `storybook` config:

```ts
// .storybook/main.js
export default {
    // ...
    features: {
        // ...
        buildStoriesJson: true
    }
}
```

You don't need to do this with storybook@7 or storybook@8.

### Testplane

Add `@testplane/storybook` plugin into your Testplane config:

```ts
// .testplane.conf.ts
export default {
    plugins: {
        '@testplane/storybook': {},

        // other Testplane plugins...
    },

    // other Testplane settings...
}
```

With this minimal config, you will be able to run `npx testplane --storybook` to autotest each storybook story with [Testplane assertView](https://github.com/gemini-testing/testplane#assertview) command. Testplane will open each story, wait for play function to finish (if defined), and then call `assertView` command. These tests would be generated in runtime.

Full plugin config:

| **Parameter**      | **Type**                | **Default&nbsp;value** | **Description**                                                             |
| ------------------ | ----------------------- | ---------------------- | --------------------------------------------------------------------------- |
| enabled	         | Boolean                 | true                   | Enable / disable the plugin                                                                      |
| storybookConfigDir | String                  | ".storybook"           | Path to the storybook configuration directory                                                                   |
| autoScreenshots	 | Boolean                 | true                   | Enable / disable auto-screenshot tests                                                                       |
| localport	         | Number                  | 6006                   | Port to launch storybook dev server on                                                                          |
| remoteStorybookUrl | String                  | ""                     | URL of the remote Storybook. If specified, local storybook dev sever would not be launched                             |
| browserIds         | Array<String \| RegExp> | []                     | Array of `browserId` to run storybook tests on. By default, all of browsers, specified in Testplane config would be used |

> ⚠️ *Storybook tests performance greatly depends on [Testplane testsPerSession](https://github.com/gemini-testing/testplane#testspersession) parameter, as these tests speeds up on reusing existing sessions, so setting values around 20+ is preferred*

> ⚠️ *These tests ignore [Testplane isolation](https://github.com/gemini-testing/testplane#isolation). It would be turned off unconditionally*

## Advanced usage

If you have `ts-node` in your project, you can write your Testplane tests right inside of storybook story files:

> ⚠️ *Storybook story files must have `.js` or `.ts` extension for this to work*

```ts
import type { StoryObj } from "@storybook/react";
import type { WithTestplane } from "@testplane/storybook"

export const Primary: WithTestplane<StoryObj> = {
    args: {
        primary: true,
        label: "Button",
    },
    testplane: {
        "my test": async ({browser, expect}) => {
            const element = await browser.$(".storybook-button");

            await expect(element).toHaveText("Button");
        }
    }
};
```

You can also specify extra options in story default config:

```ts
import type { WithTestplane } from "@testplane/storybook"
import type { Meta, StoryObj } from "@storybook/react";

const meta: WithTestplane<Meta<typeof Button>> = {
    title: "Example/Button",
    component: Button,
    testplane: {
        skip: false, // if true, skips all Testplane tests from this story file
        autoscreenshotSelector: ".my-selector", // Custom selector to auto-screenshot elements
        browserIds: ["chrome"], // Testplane browsers to run tests from this story file
        assertViewOpts: { // override default assertView options for tests from this file
            ignoreDiffPixelCount: 5
        }
    }
};

export default meta;
```

If you decide to create separate config for storybook auto-tests (which is suggested), you need to specify config path via CLI option. For example:

```bash
npx testplane --storybook -c .testplane.storybook.conf.ts
```

This allows you to store references next to your story files:

```ts
// .testplane.conf.ts
import path from "path";
import { getStoryFile } from "@testplane/storybook";

export default {
    screenshotsDir: (test) => {
        const relativeStoryFilePath = getStoryFile(test);
        const relativeStoryFileDirPath = path.dirname(relativeStoryFilePath);

        return path.join(relativeStoryFileDirPath, "screens", test.id, test.browserId);
    },
    // other Testplane settings...
}
```

In this example, screenshot references would be stored in `screens/<testId>/<browserId>` folder, next to each of your story files.
