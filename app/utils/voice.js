export const playWelcomeMessage = (message) => {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.pitch = 1;
        utterance.rate = 1;
        // Optional: Select a specific voice if available
        // const voices = window.speechSynthesis.getVoices();
        // utterance.voice = voices.find(voice => voice.name.includes('Google US English')); 
        window.speechSynthesis.speak(utterance);
    }
};
