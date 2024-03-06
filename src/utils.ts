import _ from "lodash";
import type { Config } from "hermione";
import { STORYBOOK_SET_NAME, STORYBOOK_KNOWN_PATH_ENDINGS } from "./constants";

const trimUrlEnding = (urlObj: URL, ending: string): void => {
    const pathName = _.trimEnd(urlObj.pathname, "/");

    if (pathName.endsWith(ending)) {
        urlObj.pathname = pathName.slice(0, -ending.length);
    }
};

export const getStorybookPathEndingWith = (url: string, pathEnding: string): string => {
    const urlObj = new URL(url);

    STORYBOOK_KNOWN_PATH_ENDINGS.forEach(ending => trimUrlEnding(urlObj, ending));

    urlObj.pathname = _.trimEnd(urlObj.pathname, "/") + `/${pathEnding}`;

    return urlObj.toString();
};

export const patchHermioneSets = (config: Config, browserIds: string[], files: string[]): void => {
    const browsers = _.isEmpty(browserIds) ? Object.keys(config.browsers) : browserIds;

    config.sets = {
        [STORYBOOK_SET_NAME]: {
            browsers,
            files,
        },
    };
};

export const patchHermioneBaseUrl = (config: Config, baseUrl: string): void => {
    config.getBrowserIds().forEach(browserId => {
        const browserConfig = config.forBrowser(browserId);

        browserConfig.baseUrl = baseUrl;
    });
};

export const disableHermioneIsolation = (config: Config, browserIds: string[]): void => {
    const browsers = _.isEmpty(browserIds) ? Object.keys(config.browsers) : browserIds;

    browsers.forEach(browserId => {
        const browserConfig = config.forBrowser(browserId);

        browserConfig.isolation = false;
    });
};
