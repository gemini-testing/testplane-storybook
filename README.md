# hermione-storybook

A [storybook](https://github.com/storybookjs/storybook) addon that makes it easy to write hermione tests on storybook component and speeds up their execution time.

## Installation

```bash
npm install hermione-storybook --save-dev
```

## Usage

hermione-storybook is not only a storybook addon, but also it is a plugin for hermione which adds `selectStory` command to open story via storybook API.

### Storybook

If you use storybook@6 and higher:

* Add `hermione-storybook` addon into your `storybook` config:

```js
// .storybook/main.js
module.exports = {
    // ...
    addons: [
        // ...
        'hermione-storybook'
    ]
}
```

If you use storybook@5:

* Add `hermione-storybook` decorator to your `.storybook/config.js` file:

```js
// .storybook/config.js
import { addDecorator, configure } from '@storybook/react';
import { withHermione } from 'hermione-storybook';

addDecorator(withHermione());

configure(...);
```

### Hermione

* Add `hermione-storybook` plugin into your `hermione` config:
```js
// .hermione.conf.js
module.exports = {
    // ...
    system: {
        plugins: {
            'hermione-storybook/plugin': {
                enabled: true,
                storybookUrl: 'http://localhost:6006'
            }
        }
    }
}
```

* Write hermione-test using `selectStory` command from plugin:
```js
describe('button', () => {
    it('primary', async function() {
        await this.browser.selectStory('example-button--primary', {label: 'New button label'}); // second parameter with `args` works only for storybook@6 and higher

        await this.browser.assertView('plain', 'body');
    });
});
```

## Hermione

### Configuration

* **enabled** (optional) `Boolean` – enable/disable the plugin. By default plugin is enabled;
* **storybookUrl** (required) `String` - url to your storybook server (example - `http://localhost:6006`). Moreover it can be specified as a relative url for [baseUrl](https://github.com/gemini-testing/hermione#baseurl) option in hermione. By default url is `http://localhost:6006`;

Also there is ability to override plugin parameters by CLI options or environment variables (see [configparser](https://github.com/gemini-testing/configparser)).
Use `hermione_storybook_` prefix for the environment variables and `--storybook-` for the cli options.

### API

Plugin adds the following commands to the `hermione`:

* selectStory - command to open passed story via storybook API. Moreover it can also take arguments which should be updated for the story.

Examples:

* open passed story:
```js
await this.browser.selectStory('example-button--primary');
```

* open passed story and change `label` and `size` args (changing args works only for storybook@6 and higher):
```js
await this.browser.selectStory('example-button--primary', {label: 'Some label', size: 'large'});
```

## Tips & Tricks

* To check that the `hermione-storybook` addon is connected to your storybook project correctly, you need to open the preview iframe (for example - http://localhost:6006/iframe.html) and call `window.__HERMIONE_SELECT_STORY__` method like that:

```js
window.__HERMIONE_SELECT_STORY__('example-button--primary', {label: 'Some label'});
```

After that your story with id `example-button--primary` will be rendered on preview iframe. It means that everything works fine.

* To convert old url queries `selectedKind` and `selectedStory` (users of storybook@5) to story id you can use the following helper:

```js
import { toId, storyNameFromExport } from '@storybook/csf';
const storyId = toId(selectedKind, storyNameFromExport(selectedStory));
```
