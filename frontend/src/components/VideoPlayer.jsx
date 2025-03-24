import "./VideoPlayer.css";

const VideoPlayer = ({ char, mediaSrc }) => {
  return (
    <div className="video-item">
      <div className="char-display">{char}</div>
      <video src={mediaSrc} controls autoPlay loop className="sign-video" />
    </div>
  );
};

export default VideoPlayer;
