import { useState } from "react";
import Carousel from "../../components/Carousel";
import TestCases from "../../components/TestCases/TestCases";
import { translateToSignLanguage } from "../../utils/translator";

import "./MalayalamToSign.css";

import micIcon from "../../assets/mic.svg";

function MalayalamToSign() {
  const [inputText, setInputText] = useState("");
  const [wordTranslations, setWordTranslations] = useState([]);
  const [isListening, setIsListening] = useState(false);

  const handleInputChange = (e) => {
    const text = e.target.value;
    processText(text);
  };

  const processText = (text) => {
    setInputText(text);
    const words = text.split(/\s+/).filter((word) => word.length > 0);
    const translations = words.map((word) => ({
      word,
      translations: translateToSignLanguage(word),
    }));
    setWordTranslations(translations);
  };

  const handleTestSelect = (testCase) => {
    processText(testCase);
  };

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    const recognition = new webkitSpeechRecognition(); // For Chrome
    recognition.lang = "ml-IN"; // Malayalam language
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      processText(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
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

      <img
        src={micIcon}
        className={`mic-icon ${isListening ? "listening" : ""}`}
        onClick={startListening}
        title="Click to start voice recognition"
        alt="Microphone"
      />

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
