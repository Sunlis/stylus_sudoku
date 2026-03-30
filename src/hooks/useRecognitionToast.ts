import React from 'react';

import type { RecognitionOutcome } from '@app/handwriting';

export type RecognitionCandidates = {
  local?: string[];
  remote?: string[];
} | null;

export const useRecognitionToast = () => {
  const [candidates, setCandidates] = React.useState<RecognitionCandidates>(null);
  const timeoutRef = React.useRef<number | null>(null);

  const showCandidates = React.useCallback((outcome: RecognitionOutcome) => {
    setCandidates({
      local: outcome.localCandidates,
      remote: outcome.remoteCandidates ?? outcome.candidates,
    });

    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setCandidates(null);
      timeoutRef.current = null;
    }, 4000);
  }, []);

  const clear = React.useCallback(() => {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setCandidates(null);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { candidates, showCandidates, clear };
};
