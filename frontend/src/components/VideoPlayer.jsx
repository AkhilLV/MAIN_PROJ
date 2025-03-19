import "./VideoPlayer.css";

const VideoPlayer = ({ char, videoSrc }) => {
  return (
    <div className="video-item">
      <div className="char-display">{char}</div>
      <video src={videoSrc} controls autoPlay loop className="sign-video" />
    </div>
  );
};

export default VideoPlayer;
