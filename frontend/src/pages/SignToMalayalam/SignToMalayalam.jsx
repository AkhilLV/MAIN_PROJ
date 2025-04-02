import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./SignToMalayalam.css";

const TIME_BETWEEN_FRAMES = 200;

const SignToMalayalam = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [gesture, setGesture] = useState("");
  const [gestureText, setGestureText] = useState("");
  const [movement, setMovement] = useState("");
  const [processedImage, setProcessedImage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const previousGestureRef = useRef("");

  useEffect(() => {
    const newSocket = io("ws://localhost:5000", {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to WebSocket server");
    });

    newSocket.on("processed_frame", (data) => {
      if (data.frame) setProcessedImage(`data:image/jpeg;base64,${data.frame}`);
      if (data.gesture && data.gesture !== previousGestureRef.current) {
        setGesture(data.gesture);
        setGestureText((prevText) => prevText + " " + data.gesture);
        previousGestureRef.current = data.gesture;
        speakMalayalam(data.gesture); // Speak detected gesture
      }
      if (data.movement) setMovement(data.movement);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from WebSocket server");
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  const speakMalayalam = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ml-IN";
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const setupWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          startFrameProcessing();
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    };

    if (isConnected) {
      setupWebcam();
    }
    return () => stopWebcam();
  }, [isConnected]);

  const startFrameProcessing = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !socket) return;

    const ctx = canvas.getContext("2d");
    const frameInterval = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg").split(",")[1];
        socket.emit("frame", imageData);
      }
    }, TIME_BETWEEN_FRAMES);
    return () => clearInterval(frameInterval);
  };

  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  return (
    <div className="sign-to-malayalam-container">
      <div className="status">
        Connection Status: {isConnected ? "Connected" : "Disconnected"}
      </div>
      <div className="feeds-wrapper">
        <div className="feed-box live-feed">
          <h3>Live Camera Feed</h3>
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{ borderRadius: "8px", transform: "scaleX(-1)" }}
          />
        </div>
        <div className="feed-box">
          <h3>Processed Output</h3>
          <canvas ref={canvasRef} style={{ display: "none" }} />
          {processedImage ? (
            <div className="processed-frame">
              <img src={processedImage} alt="Processed Frame" />
              <div className="overlay-text">
                {gesture && <div className="gesture">Gesture: {gesture}</div>}
                {movement && (
                  <div className="movement">Movement: {movement}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="placeholder">Waiting for processed frames...</div>
          )}
        </div>
      </div>
      <div className="gesture-text-box">
        <h3>Detected Gestures</h3>
        <textarea
          cols={100}
          rows={100}
          value={gestureText}
          placeholder="Detected gestures will appear here..."
          readOnly
        />
      </div>
    </div>
  );
};

export default SignToMalayalam;
