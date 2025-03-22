from flask import Flask
from flask_socketio import SocketIO, emit
import cv2
import numpy as np
import mediapipe as mp
import base64
from collections import deque
import csv
from flask_cors import CORS
import time
from mediapipe.framework.formats import landmark_pb2

# Initialize global timestamp counter
last_timestamp = 0
timestamp_counter = 0

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, 
    cors_allowed_origins="*",
    async_mode='eventlet',  # Changed to eventlet for better WebSocket support
    ping_timeout=60000,
    ping_interval=25000,
    logger=True,
    engineio_logger=True
)

# MediaPipe initialization
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils  # Drawing utilities

# Load classifiers
from model import KeyPointClassifier
keypoint_classifier = KeyPointClassifier()

# Read labels
with open('model/keypoint_classifier/keypoint_classifier_label.csv', encoding='utf-8-sig') as f:
    keypoint_classifier_labels = [row[0] for row in csv.reader(f)]

print(keypoint_classifier_labels)

# Initialize history buffers
history_length = 16
finger_gesture_history = deque(maxlen=history_length)

def process_frame(frame_data):
    global last_timestamp, timestamp_counter

    # Generate strict monotonic timestamp
    timestamp_counter += 1
    current_timestamp = int(timestamp_counter * 1e6)  # Convert to microseconds
    if current_timestamp <= last_timestamp:
        current_timestamp = last_timestamp + 1
    last_timestamp = current_timestamp

    # Decode and process frame
    nparr = np.frombuffer(base64.b64decode(frame_data), np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    frame_rgb.flags.writeable = False

    result_data = {
        'frame': None,
        'gesture': None,
        'movement': None,
        'translation': None,
        'timestamp': current_timestamp
    }

    with mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.7,
        min_tracking_confidence=0.5,
    ) as hands:
        results = hands.process(frame_rgb)
        
        if results.multi_hand_landmarks:
            annotated_frame = frame.copy()
            
            for hand_landmarks in results.multi_hand_landmarks:
                # Draw landmarks
                mp_drawing.draw_landmarks(
                    annotated_frame,
                    hand_landmarks,
                    mp_hands.HAND_CONNECTIONS
                )

                # Extract keypoints
                keypoints = []
                for landmark in hand_landmarks.landmark:
                    keypoints.extend([landmark.x, landmark.y])
                
                # Classify gesture
                keypoint_class = keypoint_classifier(keypoints)
                print(keypoint_class)
                keypoint_label = keypoint_classifier_labels[keypoint_class]
                result_data['gesture'] = keypoint_label

                # Update history
                
                # # Classify movement
                # if len(point_history) == history_length:
                #     point_history_class = point_history_classifier(list(point_history))
                #     point_history_label = point_history_classifier_labels[point_history_class]
                #     result_data['movement'] = point_history_label
                    
                #     # Add text overlay
                #     cv2.putText(annotated_frame, f"Gesture: {keypoint_label}", (10, 30),
                #                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                #     cv2.putText(annotated_frame, f"Movement: {point_history_label}", (10, 60),
                #                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                    
                #     result_data['translation'] = f"{keypoint_label} - {point_history_label}"

            # Encode processed frame
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            result_data['frame'] = base64.b64encode(buffer).decode('utf-8')
        else:
            # Encode original frame if no hands detected
            _, buffer = cv2.imencode('.jpg', frame)
            result_data['frame'] = base64.b64encode(buffer).decode('utf-8')

    return result_data

@socketio.on('frame')
def handle_frame(data):
    try:
        result_data = process_frame(data)
        emit('processed_frame', result_data)
    except Exception as e:
        print(f"Error processing frame: {str(e)}")
        emit('error', {'message': str(e)})

if __name__ == '__main__':
    socketio.run(app, port=5000)