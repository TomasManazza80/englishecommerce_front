import { useState, useEffect } from "react";

/**
 * Custom hook for a looping typewriter effect without external dependencies.
 * @param {string[]} phrases - Array of phrases to cycle through.
 * @param {object} options
 * @param {number} [options.typingSpeed=80] - Delay in ms per typed character.
 * @param {number} [options.deletingSpeed=50] - Delay in ms per deleted character.
 * @param {number} [options.pauseTime=1500] - Pause in ms before deleting a completed phrase.
 * @returns {string} The current visible substring.
 */
export function useTypewriter(
  phrases = [],
  { typingSpeed = 80, deletingSpeed = 50, pauseTime = 1500 } = {}
) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!phrases.length) return;

    const currentPhrase = phrases[phraseIndex % phrases.length];

    let delay = isDeleting ? deletingSpeed : typingSpeed;
    if (!isDeleting && text === currentPhrase) {
      delay = pauseTime;
    }

    const timeout = setTimeout(() => {
      if (!isDeleting && text === currentPhrase) {
        setIsDeleting(true);
      } else if (isDeleting && text === "") {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      } else {
        setText(
          isDeleting
            ? currentPhrase.slice(0, text.length - 1)
            : currentPhrase.slice(0, text.length + 1)
        );
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseTime]);

  return text;
}
