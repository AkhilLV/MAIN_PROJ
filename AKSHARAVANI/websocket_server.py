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
import copy
import itertools

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

# Initialize history buffers
history_length = 16
finger_gesture_history = deque(maxlen=history_length)

def calc_bounding_rect(image, landmarks):
    image_width, image_height = image.shape[1], image.shape[0]
    
    landmark_array = np.empty((0, 2), int)
    
    for _, landmark in enumerate(landmarks.landmark):
        landmark_x = min(int(landmark.x * image_width), image_width - 1)
        landmark_y = min(int(landmark.y * image_height), image_height - 1)
        
        landmark_point = [np.array((landmark_x, landmark_y))]
        landmark_array = np.append(landmark_array, landmark_point, axis=0)
    
    x, y, w, h = cv2.boundingRect(landmark_array)
    
    return [x, y, x + w, y + h]

def calc_landmark_list(image, landmarks):
    image_width, image_height = image.shape[1], image.shape[0]
    
    landmark_point = []
    
    # Keypoint
    for _, landmark in enumerate(landmarks.landmark):
        landmark_x = min(int(landmark.x * image_width), image_width - 1)
        landmark_y = min(int(landmark.y * image_height), image_height - 1)
        
        landmark_point.append([landmark_x, landmark_y])
    
    return landmark_point

def pre_process_landmark(landmark_list):
    temp_landmark_list = copy.deepcopy(landmark_list)
    
    # Convert to relative coordinates
    base_x, base_y = 0, 0
    for index, landmark_point in enumerate(temp_landmark_list):
        if index == 0:
            base_x, base_y = landmark_point[0], landmark_point[1]
        
        temp_landmark_list[index][0] = temp_landmark_list[index][0] - base_x
        temp_landmark_list[index][1] = temp_landmark_list[index][1] - base_y
    
    # Convert to a one-dimensional list
    temp_landmark_list = list(
        itertools.chain.from_iterable(temp_landmark_list))
    
    # Normalization
    max_value = max(list(map(abs, temp_landmark_list)))
    
    def normalize_(n):
        return n / max_value
    
    temp_landmark_list = list(map(normalize_, temp_landmark_list))
    
    return temp_landmark_list

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
                
                # Calculate bounding box
                brect = calc_bounding_rect(annotated_frame, hand_landmarks)
                
                # Draw bounding box
                cv2.rectangle(annotated_frame, 
                             (brect[0], brect[1]), 
                             (brect[2], brect[3]), 
                             (0, 255, 0), 2)

                # Extract keypoints and landmark list
                landmark_list = calc_landmark_list(annotated_frame, hand_landmarks)
                
                # Pre-process landmarks
                pre_processed_landmark_list = pre_process_landmark(landmark_list)
                
                # Classify gesture
                keypoint_class = keypoint_classifier(pre_processed_landmark_list)
                keypoint_label = keypoint_classifier_labels[keypoint_class]
                result_data['gesture'] = keypoint_label

                # Add text overlay
                cv2.putText(annotated_frame, f"Gesture: {keypoint_label}", 
                           (brect[0], brect[1] - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

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