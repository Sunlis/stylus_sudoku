import React from 'react';

import type { RecognitionCandidates } from '@app/hooks/useRecognitionToast';

type RecognitionToastProps = {
  candidates: RecognitionCandidates;
};

export const RecognitionToast: React.FC<RecognitionToastProps> = ({ candidates }) => {
  if (!candidates) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-4 flex justify-center px-4"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="max-w-sm rounded-xl bg-slate-900/95 px-3 py-2 text-xs text-slate-50 shadow-lg ring-1 ring-slate-700"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="font-semibold mb-1">Recognition candidates</div>
        {candidates.local && candidates.local.length > 0 && (
          <div className="break-words mb-1">
            <span className="font-semibold">Local: </span>
            <span>{candidates.local.join(', ')}</span>
          </div>
        )}
        {candidates.remote && candidates.remote.length > 0 && (
          <div className="break-words">
            <span className="font-semibold">Remote: </span>
            <span>{candidates.remote.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
