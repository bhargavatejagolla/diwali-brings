/**
 * VoiceTrigger — Speech recognition to ignite fireworks with voice
 */

class VoiceTrigger {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onKeyword = null;
    this.init();
  }

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'en-IN';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;

        this.recognition.onresult = (e) => {
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const transcript = e.results[i][0].transcript.toLowerCase();
            if (transcript.includes('diwali') || transcript.includes('happy diwali') || transcript.includes('light') || transcript.includes('shravya')) {
              if (this.onKeyword) {
                this.onKeyword(transcript);
              }
            }
          }
        };

        this.recognition.onerror = () => {
          this.isListening = false;
        };
      } catch (err) {
        console.warn("Speech recognition error", err);
      }
    }
  }

  start(callback) {
    this.onKeyword = callback;
    if (!this.recognition || this.isListening) return false;
    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (e) {
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListening = false;
    }
  }
}

export const voiceTrigger = new VoiceTrigger();
