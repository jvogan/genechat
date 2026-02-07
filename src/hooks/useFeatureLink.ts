import { useRef, useCallback } from 'react';
import { useUIStore } from '../store/ui-store';

/**
 * Bidirectional sync hook for feature selection between workspace and viz panel.
 * Prevents infinite loops via selectionSource tracking.
 */
export function useFeatureLink(source: 'workspace' | 'map') {
  const selectedFeatureId = useUIStore((s) => s.selectedFeatureId);
  const selectionSource = useUIStore((s) => s.selectionSource);
  const selectFeature = useUIStore((s) => s.selectFeature);
  const isLocalUpdate = useRef(false);

  const handleSelect = useCallback(
    (featureId: string | null) => {
      isLocalUpdate.current = true;
      selectFeature(featureId, source);
      // Reset flag after microtask to allow external updates
      queueMicrotask(() => {
        isLocalUpdate.current = false;
      });
    },
    [selectFeature, source],
  );

  // Whether this component should react to the current selection
  // Intentional ref read to break feedback loop; always false during normal renders
  /* eslint-disable react-hooks/refs */
  const isExternalSelection =
    selectedFeatureId !== null &&
    selectionSource !== null &&
    selectionSource !== source &&
    !isLocalUpdate.current;

  return {
    selectedFeatureId,
    isExternalSelection,
    selectFeature: handleSelect,
  };
  /* eslint-enable react-hooks/refs */
}
