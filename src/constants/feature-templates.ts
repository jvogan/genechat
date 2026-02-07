import type { FeatureType } from '../bio/types';

export interface FeatureTemplate {
  name: string;
  type: FeatureType;
  color: string;
  category: string;
  description: string;
}

export const FEATURE_TEMPLATES: FeatureTemplate[] = [
  // Promoters
  { name: 'T7 promoter', type: 'promoter', color: '#fbbf24', category: 'Promoters', description: 'Bacteriophage T7 RNA polymerase promoter' },
  { name: 'lac promoter', type: 'promoter', color: '#fbbf24', category: 'Promoters', description: 'E. coli lac operon promoter' },
  { name: 'CMV promoter', type: 'promoter', color: '#fbbf24', category: 'Promoters', description: 'Cytomegalovirus immediate early promoter' },
  { name: 'tac promoter', type: 'promoter', color: '#fbbf24', category: 'Promoters', description: 'Hybrid trp-lac promoter' },

  // Terminators
  { name: 'T7 terminator', type: 'terminator', color: '#fb7185', category: 'Terminators', description: 'T7 RNA polymerase terminator' },
  { name: 'rrnB T1 terminator', type: 'terminator', color: '#fb7185', category: 'Terminators', description: 'E. coli rrnB T1 transcription terminator' },

  // Tags
  { name: '6xHis-tag', type: 'cds', color: '#22d3ee', category: 'Tags', description: 'Hexahistidine affinity tag' },
  { name: 'FLAG-tag', type: 'cds', color: '#22d3ee', category: 'Tags', description: 'DYKDDDDK peptide tag' },
  { name: 'GST-tag', type: 'cds', color: '#22d3ee', category: 'Tags', description: 'Glutathione S-transferase tag' },
  { name: 'MBP-tag', type: 'cds', color: '#22d3ee', category: 'Tags', description: 'Maltose-binding protein tag' },

  // Cleavage sites
  { name: 'TEV site', type: 'misc_feature', color: '#a78bfa', category: 'Cleavage sites', description: 'Tobacco Etch Virus protease cleavage site' },
  { name: 'Thrombin site', type: 'misc_feature', color: '#a78bfa', category: 'Cleavage sites', description: 'Thrombin protease cleavage site' },

  // Origins
  { name: 'pBR322 ori', type: 'origin', color: '#60a5fa', category: 'Origins', description: 'pBR322 origin of replication' },
  { name: 'ColE1 ori', type: 'origin', color: '#60a5fa', category: 'Origins', description: 'ColE1-type origin of replication' },
  { name: 'f1 ori', type: 'origin', color: '#60a5fa', category: 'Origins', description: 'f1 bacteriophage origin of replication' },

  // Selection markers
  { name: 'AmpR', type: 'cds', color: '#f97316', category: 'Selection markers', description: 'Ampicillin resistance gene (beta-lactamase)' },
  { name: 'KanR', type: 'cds', color: '#f97316', category: 'Selection markers', description: 'Kanamycin resistance gene' },
];

/** Get unique categories in order */
export function getTemplateCategories(): string[] {
  const seen = new Set<string>();
  const categories: string[] = [];
  for (const t of FEATURE_TEMPLATES) {
    if (!seen.has(t.category)) {
      seen.add(t.category);
      categories.push(t.category);
    }
  }
  return categories;
}
