import { videoMap } from "../data/videoMap";

export const translateToSignLanguage = (text) => {
  const normalizedText = text.normalize("NFC");
  const translations = [];

  for (const char of normalizedText) {
    console.log(char);
    if (videoMap[char]) {
      translations.push({
        char,
        videoSrc: videoMap[char],
      });
    }
  }

  return translations;
};
