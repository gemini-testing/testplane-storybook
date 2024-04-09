export const log = console.log.bind(console, "[@testplane/storybook]:");
export const warn = console.warn.bind(console, "[@testplane/storybook]:");
export const error = console.error.bind(console, "[@testplane/storybook]:");

export default { log, warn, error };
