import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./SignToMalayalam.css";

const TIME_BETWEEN_FRAMES = 200;

const SignToMalayalam = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [gesture, setGesture] = useState("");
  const [previousGesture, setPreviousGesture] = useState("");
  const [gestureText, setGestureText] = useState(""); // Stores text box content
  const [movement, setMovement] = useState("");
  const [processedImage, setProcessedImage] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
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
      console.log("Received processed frame:", data);

      if (data.frame) setProcessedImage(`data:image/jpeg;base64,${data.frame}`);

      if (data.gesture) {
        setGesture(data.gesture);

        setPreviousGesture((prevGesture) => {
          if (data.gesture !== prevGesture) {
            setGestureText((prevText) => prevText + " " + data.gesture);
            return data.gesture;
          }

          return prevGesture;
        });
      }

      if (data.movement) setMovement(data.movement);
    });

    newSocket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from WebSocket server");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      stopWebcam();
    };
  }, []);

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

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopWebcam();
      } else if (isConnected) {
        setupWebcam();
      }
    };

    if (isConnected) {
      setupWebcam();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopWebcam();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isConnected]);

  const startFrameProcessing = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !socket) return;

    const ctx = canvas.getContext("2d");

    // Limit to 5 FPS (200ms interval)
    const frameInterval = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Mirror the image before sending
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Reset transform
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
            style={{
              borderRadius: "8px",
              transform: "scaleX(-1)", // Mirror the video
            }}
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
          readOnly
          placeholder="Detected gestures will appear here..."
        />
      </div>
    </div>
  );
};

export default SignToMalayalam;
