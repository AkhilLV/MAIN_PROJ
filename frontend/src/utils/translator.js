import { mediaMap } from "../data/mediaMap";

export const translateToSignLanguage = (text) => {
  const normalizedText = text.normalize("NFC");
  const translations = [];

  for (const char of normalizedText) {
    console.log(char);
    if (mediaMap[char]) {
      translations.push({
        char,
        mediaSrc: mediaMap[char],
      });
    }
  }

  return translations;
};
