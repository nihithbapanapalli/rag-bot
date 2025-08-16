import speech_recognition as sr
from nlu import nlu_process
import pyttsx3
import textwrap

# Initialize recognizer and text-to-speech engine
recognizer = sr.Recognizer()
engine = pyttsx3.init()


def adjust_energy_threshold(source, duration=3):
    """Dynamically adjusts the energy threshold based on background noise."""
    print("[INFO] Adjusting for background noise...")
    recognizer.energy_threshold = 100  # Start with a low threshold
    recognizer.dynamic_energy_threshold = False  # Disable auto-adjust for better control

    for _ in range(duration):
        recognizer.adjust_for_ambient_noise(source, duration=1)  # Update threshold dynamically
        print(f"[INFO] Current Energy Threshold: {recognizer.energy_threshold}")

    print("[INFO] Noise adjustment complete!")

def speech_to_text():
    try:
        with sr.Microphone() as source:
            adjust_energy_threshold(source)  # Auto-adjust energy threshold based on noise
            print("[INFO] Listening...")
            audio = recognizer.listen(source, timeout=10, phrase_time_limit=30)
            text = recognizer.recognize_google(audio)
            print(f"User: {text}")
            return text

    except sr.UnknownValueError:
        return "[ERROR] Could not understand the audio."
    except sr.RequestError:
        return "[ERROR] Speech Recognition service is down."
    except Exception as e:
        return f"[ERROR] Unexpected error: {e}"

def text_to_speech(response,width=150):   
    wrapped_text = textwrap.fill(response, width)
    print(f"Assistant:\n{wrapped_text}")  # Print the response
    engine.say(response)  # Speak the response
    engine.runAndWait()



