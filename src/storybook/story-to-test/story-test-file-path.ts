const BACK_PATH_RAW = "../";
const BACK_PATH_ENCODED = "_TP-SB-BACK_/";

export const encodeStoryPath = (storyPathRaw: string): string => {
    const subRes = storyPathRaw.replaceAll("/" + BACK_PATH_RAW, "/" + BACK_PATH_ENCODED);

    return subRes.startsWith(BACK_PATH_RAW) ? subRes.replace(BACK_PATH_RAW, BACK_PATH_ENCODED) : subRes;
};

export const decodeStoryPath = (storyPathEncoded: string): string => {
    const subRes = storyPathEncoded.replaceAll("/" + BACK_PATH_ENCODED, "/" + BACK_PATH_RAW);

    return subRes.startsWith(BACK_PATH_ENCODED) ? subRes.replace(BACK_PATH_ENCODED, BACK_PATH_RAW) : subRes;
};
