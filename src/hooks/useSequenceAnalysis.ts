import { useState, useEffect } from 'react';
import type { SequenceType, SequenceAnalysis } from '../bio/types';

interface SequenceAnalysisResult {
  type: SequenceType;
  analysis: SequenceAnalysis | null;
  isAnalyzing: boolean;
}

function detectType(raw: string): SequenceType {
  const clean = raw.toUpperCase().replace(/[\s\d\n\r>]/g, '');
  if (clean.length === 0) return 'unknown';

  let dnaCount = 0;
  let hasU = false;
  let hasT = false;

  for (const ch of clean) {
    if ('ATGCN'.includes(ch)) dnaCount++;
    if (ch === 'U') hasU = true;
    if (ch === 'T') hasT = true;
  }

  const ratio = dnaCount / clean.length;
  if (ratio > 0.95 && !hasU) return 'dna';
  if (hasU && !hasT && ratio > 0.9) return 'rna';
  if (ratio < 0.8) return 'protein';
  return 'unknown';
}

function mockAnalysis(raw: string, type: SequenceType): SequenceAnalysis {
  const clean = raw.toUpperCase().replace(/[\s\d\n\r>]/g, '');
  const len = clean.length;

  let a = 0, t = 0, g = 0, c = 0, n = 0, other = 0;
  for (const ch of clean) {
    if (ch === 'A') a++;
    else if (ch === 'T' || ch === 'U') t++;
    else if (ch === 'G') g++;
    else if (ch === 'C') c++;
    else if (ch === 'N') n++;
    else other++;
  }

  const gc = len > 0 ? (g + c) / len : 0;
  const at = len > 0 ? (a + t) / len : 0;

  // Simple MW estimate (avg 330 Da per nucleotide for DNA)
  const mw = type === 'protein' ? len * 110 : len * 330;

  // Basic Tm for short oligos (Wallace rule)
  const tm = len <= 20 ? 2 * (a + t) + 4 * (g + c) : 64.9 + 41 * (g + c - 16.4) / len;

  return {
    length: len,
    gcContent: gc,
    atContent: at,
    molecularWeight: mw,
    meltingTemp: type === 'protein' ? null : tm,
    orfs: [],
    restrictionSites: [],
    composition: { A: a, T: t, G: g, C: c, N: n, other },
  };
}

export function useSequenceAnalysis(raw: string): SequenceAnalysisResult {
  const [type, setType] = useState<SequenceType>('unknown');
  const [analysis, setAnalysis] = useState<SequenceAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!raw || raw.trim().length === 0) {
      setType('unknown');
      setAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    const detected = detectType(raw);
    setType(detected);

    // Simulate async analysis
    const timer = setTimeout(() => {
      setAnalysis(mockAnalysis(raw, detected));
      setIsAnalyzing(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [raw]);

  return { type, analysis, isAnalyzing };
}
