import React, { useState, useEffect } from "react";
import VideoPlayer from "./VideoPlayer";
import "./Carousel.css";

const Carousel = ({ translations, word }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlayTimer, setAutoPlayTimer] = useState(null);

  const resetAutoPlayTimer = () => {
    // Clear existing timer if any
    if (autoPlayTimer) {
      clearTimeout(autoPlayTimer);
    }
    // Set new timer
    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % translations.length);
    }, 3000);
    setAutoPlayTimer(timer);
  };

  useEffect(() => {
    if (translations && translations.length > 0) {
      resetAutoPlayTimer();
    }
    return () => {
      if (autoPlayTimer) {
        clearTimeout(autoPlayTimer);
      }
    };
  }, [currentIndex, translations]);

  // If no translations available, show a message
  if (!translations || translations.length === 0) {
    return (
      <div className="carousel-container">
        <div className="word-display">{word}</div>
        <div className="carousel">
          <div className="carousel-content">
            <div className="no-translation">No translation available</div>
          </div>
        </div>
      </div>
    );
  }

  const nextSlide = () => {
    resetAutoPlayTimer();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % translations.length);
  };

  const prevSlide = () => {
    resetAutoPlayTimer();
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? translations.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index) => {
    resetAutoPlayTimer();
    setCurrentIndex(index);
  };

  return (
    <div className="carousel-container">
      <div className="word-display">{word}</div>
      <div className="carousel">
        <div className="carousel-content">
          {translations[currentIndex].mediaSrc.endsWith(".jpg") ? (
            <div className="  ">
              <p>{translations[currentIndex].char}</p>
              <img
                className="carousal-image"
                src={translations[currentIndex].mediaSrc}
                alt={translations[currentIndex].char}
              />
            </div>
          ) : (
            <VideoPlayer
              char={translations[currentIndex].char}
              mediaSrc={translations[currentIndex].mediaSrc}
            />
          )}
          <button className="carousel-button prev" onClick={prevSlide}>
            ❮
          </button>
          <button className="carousel-button next" onClick={nextSlide}>
            ❯
          </button>
        </div>
      </div>
      <div className="carousel-dots">
        {translations.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;
