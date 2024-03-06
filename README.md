# hermione-storybook

A hermione plugin that makes it easy to write hermione tests on storybook components.

## Installation

```bash
npm install hermione-storybook --save-dev
```

## Usage

Storybook 6.4+ and hermione 8.4+ are required to use this plugin.

### Storybook

If you use storybook@6, you will need to enable `buildStoriesJson` feature in your `storybook` config:

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

### Hermione

Add `hermione-storybook` plugin into your `hermione` config:

```ts
// .hermione.conf.ts
export default {
    plugins: {
        'hermione-storybook': {
            enabled: true
        },

        // other hermione plugins...
    },

    // other hermione settings...
}
```

With this minimal config, you will be able to run `npx hermione --storybook` to autotest each storybook story with [hermione assertView](https://github.com/gemini-testing/hermione#assertview) command. Hermione will open each story, wait for play function to finish (if defined), and then call `assertView` command. These tests would be generated in runtime.

Full plugin config:

| **Parameter**      | **Type** | **Default&nbsp;value** | **Description**                                |
| enabled	         | Boolean  | true                   | Enable / disable the plugin                    |
| storybookConfigDir | String   | ".storybook"           | Path to the storybook configuration directory  |
| autoScreenshots	 | Boolean  | true                   | Enable / disable auto-screenshot tests         |
| localport	         | Number   | 6006                   | Port to launch storybook dev server on         |
| remoteStorybookUrl | String   | ""                     | URL of the remote Storybook. If specified, local storybook dev sever would not be launched |
| browserIds         | String[] | []                     | Array of `browserId` to run storybook tests on. By default, all of browsers, specified in hermione config would be used |

*Note: Storybook tests performance greatly depends on [hermione testsPerSession](https://github.com/gemini-testing/hermione#testspersession) parameter, as these tests speeds up on reusing existing sessions, so setting values around 20+ is preferred*

*Note: These tests ignore [hermione isolation](https://github.com/gemini-testing/hermione#isolation). It would be turned off unconditionally*

## Advanced usage

If you have `ts-node` in your project, you can write your hermione tests right inside of storybook story files:

```ts
import type { StoryObj } from "@storybook/react";
import type { WithHermione } from "hermione-storybook"

export const Primary: WithHermione<StoryObj> = {
    args: {
        primary: true,
        label: "Button",
    },
    hermione: {
        "my test": async ({browser, expect}) => {
            const element = await browser.$(".storybook-button");

            await expect(element).toHaveText("Button");
        }
    }
};
```

You can also specify extra options in story default config:

```ts
import type { WithHermione } from "hermione-storybook"
import type { Meta, StoryObj } from "@storybook/react";

const meta: WithHermione<Meta<typeof Button>> = {
    title: "Example/Button",
    component: Button,
    hermione: {
        skip: false, // skip hermione tests from this story file
        browserIds: ["chrome"], // hermione browsers to run tests from this story file
        assertViewOpts: { // override default assertView options for tests from this file
            ignoreDiffPixelCount: 5
        }
    }
};

export default meta;
```

If you decide to create separate config for storybook auto-tests (which is suggested), you need to specify config path via CLI option. For example:

```bash
npx hermione --storybook -c .hermione.storybook.conf.ts
```

This allows you to store references next to your story files:

```ts
// .hermione.conf.ts
import path from "path";
import { getStoryFile } from "hermione-storybook";

export default {
    screenshotsDir: (test) => {
        const relativeStoryFilePath = getStoryFile(test);
        const relativeStoryFileDirPath = path.dirname(relativeStoryFilePath);

        return path.join(relativeStoryFileDirPath, "screens", test.id, test.browserId);
    },
    // other hermione settings...
}
```

In this example, screenshot references would be stored in `screens/<testId>/<browserId>` folder, next to each of your story files.
