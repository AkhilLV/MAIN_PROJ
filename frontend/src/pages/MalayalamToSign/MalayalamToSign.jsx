import { useState } from "react";
import Carousel from "../../components/Carousel";
import TestCases from "../../components/TestCases/TestCases";
import { translateToSignLanguage } from "../../utils/translator";

import "./MalayalamToSign.css";

import micIcon from "../../assets/mic.svg";

function MalayalamToSign() {
  const [inputText, setInputText] = useState("");
  const [wordTranslations, setWordTranslations] = useState([]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);

    // Split text into words and translate each word
    const words = text.split(/\s+/).filter((word) => word.length > 0);
    const translations = words.map((word) => ({
      word,
      translations: translateToSignLanguage(word),
    }));

    console.log(text);
    console.log(words);
    console.log(translations);

    setWordTranslations(translations);
  };

  const handleTestSelect = (testCase) => {
    setInputText(testCase);
    const words = testCase.split(/\s+/).filter((word) => word.length > 0);
    const translations = words.map((word) => ({
      word,
      translations: translateToSignLanguage(word),
    }));
    setWordTranslations(translations);
  };

  return (
    <div className="container">
      <h1>Malayalam to Sign Language Translator</h1>
      <p>Translate Malayalam words into their corresponding MSL with ease.</p>

      <input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        placeholder="Enter Malayalam text"
        className="input-field"
      />

      <img src={micIcon} className="mic-icon" />

      <TestCases onSelect={handleTestSelect} />

      <div className="carousels-container">
        {wordTranslations.map((wordTranslation, index) => (
          <Carousel
            key={index}
            word={wordTranslation.word}
            translations={wordTranslation.translations}
          />
        ))}
      </div>
    </div>
  );
}

export default MalayalamToSign;
