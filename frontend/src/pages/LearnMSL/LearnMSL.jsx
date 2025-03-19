import React from "react";
import "./LearnMSL.css";

function LearnMSL() {
  return (
    <div className="container">
      <h1>Learn Malayalam Sign Language</h1>
      <p>Learn MSL through interactive lessons and practice exercises.</p>

      <div className="lessons-section">
        <div className="lesson-card">
          <h2>Basic Alphabets</h2>
          <p>Learn the fundamental alphabets of Malayalam Sign Language</p>
          <button className="lesson-button">Start Learning</button>
        </div>

        <div className="lesson-card">
          <h2>Common Words</h2>
          <p>Practice frequently used words in MSL</p>
          <button className="lesson-button">Start Learning</button>
        </div>

        <div className="lesson-card">
          <h2>Basic Phrases</h2>
          <p>Learn common phrases and greetings</p>
          <button className="lesson-button">Start Learning</button>
        </div>

        <div className="lesson-card">
          <h2>Practice Exercises</h2>
          <p>Test your knowledge with interactive exercises</p>
          <button className="lesson-button">Start Practice</button>
        </div>
      </div>
    </div>
  );
}

export default LearnMSL;
