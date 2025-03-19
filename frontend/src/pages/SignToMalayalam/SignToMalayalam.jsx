import React, { useState, useEffect, useRef } from "react";
import "./SignToMalayalam.css";

function SignToMalayalam() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [translation, setTranslation] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameCaptureRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setIsCameraOn(true);

      // Start sending frames to backend
      startFrameCapture();
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert(
        "Error accessing camera. Please make sure you have granted camera permissions."
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
    }
    if (frameCaptureRef.current) {
      cancelAnimationFrame(frameCaptureRef.current);
      frameCaptureRef.current = null;
    }
  };

  const startFrameCapture = () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const captureFrame = async () => {
      if (!isCameraOn || !videoRef.current) return;

      try {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        // Convert canvas to blob
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.8)
        );

        // Send frame to backend
        const formData = new FormData();
        formData.append("frame", blob);

        const response = await fetch("http://localhost:5000/process-frame", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setTranslation(data.translation);
        }
      } catch (err) {
        console.error("Error processing frame:", err);
      }

      // Request next frame
      frameCaptureRef.current = requestAnimationFrame(captureFrame);
    };

    captureFrame();
  };

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="container">
      <h1>Sign to Malayalam Translator</h1>
      <p>
        Use your camera to translate sign language to Malayalam text in
        real-time.
      </p>

      <div className="camera-section">
        <div className="camera-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="camera-feed"
            style={{ display: isCameraOn ? "block" : "none" }}
          />
          {!isCameraOn && (
            <div className="camera-placeholder">
              <p>Camera feed will appear here</p>
            </div>
          )}
        </div>

        <div className="translation-container">
          <h2>Translation Result</h2>
          <div className="translation-box">
            {translation || "Your translation will appear here..."}
          </div>
        </div>
      </div>

      <div className="controls">
        <button
          className={`camera-button ${isCameraOn ? "stop" : "start"}`}
          onClick={isCameraOn ? stopCamera : startCamera}
        >
          {isCameraOn ? "Stop Camera" : "Start Camera"}
        </button>
      </div>
    </div>
  );
}

export default SignToMalayalam;
