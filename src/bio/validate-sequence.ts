export interface ValidationResult {
  cleaned: string;
  invalidCount: number;
  invalidChars: string[];
}

export function validateAndCleanSequence(raw: string): ValidationResult {
  // Strip whitespace and digits first
  const stripped = raw.replace(/[\s\d]/g, '');
  if (stripped.length === 0) return { cleaned: '', invalidCount: 0, invalidChars: [] };

  // Detect type by checking character composition
  const upper = stripped.toUpperCase();
  const dnaChars = new Set('ATGCNRYSWKMBDHV'.split(''));
  const rnaChars = new Set('AUGCNRYSWKMBDHV'.split(''));
  const proteinChars = new Set('ACDEFGHIKLMNPQRSTVWY*'.split(''));

  let dnaCount = 0, rnaCount = 0, proteinCount = 0;
  for (const ch of upper) {
    if (dnaChars.has(ch)) dnaCount++;
    if (rnaChars.has(ch)) rnaCount++;
    if (proteinChars.has(ch)) proteinCount++;
  }

  // Determine type
  let validChars: Set<string>;
  const hasU = upper.includes('U');
  const hasT = upper.includes('T');

  if (hasU && !hasT && rnaCount / upper.length > 0.8) {
    // RNA
    validChars = new Set('AUGCNRYSWKMBDHVaugcnryswkmbdhv'.split(''));
  } else if (!hasU && dnaCount / upper.length > 0.8) {
    // DNA
    validChars = new Set('ATGCNRYSWKMBDHVatgcnryswkmbdhv'.split(''));
  } else if (proteinCount / upper.length > 0.8) {
    // Protein
    validChars = new Set('ACDEFGHIKLMNPQRSTVWYacdefghiklmnpqrstvwy*'.split(''));
  } else {
    // Unknown/mixed: return as-is
    return { cleaned: stripped, invalidCount: 0, invalidChars: [] };
  }

  const invalidCharsSet = new Set<string>();
  let cleaned = '';
  let invalidCount = 0;

  for (const ch of stripped) {
    if (validChars.has(ch)) {
      cleaned += ch;
    } else {
      invalidCount++;
      invalidCharsSet.add(ch);
    }
  }

  return { cleaned, invalidCount, invalidChars: [...invalidCharsSet] };
}
