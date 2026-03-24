import { useEffect, useState } from "react";

/**
 * Hook that detects when the app window loses focus.
 * Used to trigger privacy blur on the webview content.
 */
export function usePrivacyBlur() {
  const [isBlurred, setIsBlurred] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false); // User toggle

  useEffect(() => {
    if (!isEnabled) {
      setIsBlurred(false);
      return;
    }

    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isEnabled]);

  return { isBlurred, isEnabled, setIsEnabled };
}
