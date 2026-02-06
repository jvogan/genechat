import { useState, useEffect, useRef } from 'react';
import { ArrowUp, Upload, Download } from 'lucide-react';
import SequenceBlock from './SequenceBlock';
import EmptyState from './EmptyState';
import { useSequenceStore } from '../../store/sequence-store';
import { useUIStore } from '../../store/ui-store';
import { useProjectStore } from '../../store/project-store';
import {
  reverseComplement,
  translate,
  reverseTranslate,
  codonOptimize,
  autoAnnotate,
  annotateToFeatures,
  parseFasta,
  parseGenBank,
  detectFileFormat,
} from '../../bio';
import type { ManipulationType } from '../../bio/types';
import { exportToFasta, exportToMarkdown, downloadFile } from '../../persistence/export';

// ---- Sample sequences for seed data ----
const GFP_SEQ =
  'ATGGTGAGCAAGGGCGAGGAGCTGTTCACCGGGGTGGTGCCCATCCTGGTCGAGCTGGACGGCGACGTAAACGGCCACAAGTTCAGCGTGTCCGGCGAGGGCGAGGGCGATGCCACCTACGGCAAGCTGACCCTGAAGTTCATCTGCACCACCGGCAAGCTGCCCGTGCCCTGGCCCACCCTCGTGACCACCCTGACCTACGGCGTGCAGTGCTTCAGCCGCTACCCCGACCACATGAAGCAGCACGACTTCTTCAAGTCCGCCATGCCCGAAGGCTACGTCCAGGAGCGCACCATCTTCTTCAAGGACGACGGCAACTACAAGACCCGCGCCGAGGTGAAGTTCGAGGGCGACACCCTGGTGAACCGCATCGAGCTGAAGGGCATCGACTTCAAGGAGGACGGCAACATCCTGGGGCACAAGCTGGAGTACAACTACAACAGCCACAACGTCTATATCATGGCCGACAAGCAGAAGAACGGCATCAAGGTGAACTTCAAGATCCGCCACAACATCGAGGACGGCAGCGTGCAGCTCGCCGACCACTACCAGCAGAACACCCCCATCGGCGACGGCCCCGTGCTGCTGCCCGACAACCACTACCTGAGCACCCAGTCCGCCCTGAGCAAAGACCCCAACGAGAAGCGCGATCACATGGTCCTGCTGGAGTTCGTGACCGCCGCCGGGATCACTCTCGGCATGGACGAGCTGTACAAGTAA';

const GFP_PROTEIN =
  'MVSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTLVTTLTYGVQCFSRYPDHMKQHDFFKSAMPEGYVQERTIFFKDDGNYKTRAEVKFEGDTLVNRIELKGIDFKEDGNILGHKLEYNYNSHNVYIMADKQKNGIKVNFKIRHNIEDGSVQLADHYQQNTPIGDGPVLLPDNHYLSTQSALSKDPNEKRDHMVLLEFVTAAGITLGMDELYK';

const PUC19_FRAGMENT =
  'TCGCGCGTTTCGGTGATGACGGTGAAAACCTCTGACACATGCAGCTCCCGGAGACGGTCACAGCTTGTCTGTAAGCGGATGCCGGGAGCAGACAAGCCCGTCAGGGCGCGTCAGCGGGTGTTGGCGGGTGTCGGGGCTGGCTTAACTATGCGGCATCAGAGCAGATTGTACTGAGAGTGCACCATATGCGGTGTGAAATACCGCACAGATGCGTAAGGAGAAAATACCGCATCAGGCGCCATTCGCCATTCAGGCTGCGCAACTGTTGGGAAGGGCGATCGGTGCGGGCCTCTTCGCTATTACGCCAGCTGGCGAAAGGGGGATGTGCTGCAAGGCGATTAAGTTGGGTAACGCCAGGGTTTTCCCAGTCACGACGTTGTAAAACGACGGCCAGTGAATTCGAGCTCGGTACCCGGGGATCCTCTAGAGTCGACCTGCAGGCATGCAAGCTTGGCGTAATCATGGTCATAGCTGTTTCCTGTGTGAAATTGTTATCCGCTCACAATTCCACACAACATACGAGCCGGAAGCATAAAGTGTAAAGCCTGGGGTGCCTAATGAGTGAGCTAACTCACATTAATTGCGTTGCGCTCACTGCCCGCTTTCCAGTCGGGAAACCTGTCGTGCCAGCTGCATTAATGAATCGGCCAACGCGCGGGGAGAGGCGGTTTGCGTATTGGGCGCTCTTCCGCTTCCTCGCTCACTGACTCGCTGCGCTCGGTCGTTCGGCTGCGGCGAGCGGTATCAGCTCACTCAAAGGCGGTAATACGGTTATCCACAGAATCAGGGGATAACGCAGGAAAGAACATGTGAGCAAAAGGCCAGCAAAAGGCCAGGAACCGTAAAAAGGCCGCGTTGCTGGCGTTTTTCCATAGGCTCCGCCCCCCTGACGAGCATCACAAAAATCGACGCTCAAGTCAGAGGTGGCGAAACCCGACAGGACTATAAAGATACCAGGCGTTTCCCCCTGGAAGCTCCCTCGTGCGCTCTCCTGTTCCGACCCTGCCGCTTACCGGATACCTGTCCGCCTTTCTCCCTTCGGGAAGCGTGGCGCTTTCTCATAGCTCACGCTGTAGGTATCTCAGTTCGGTGTAGGTCGTTCGCTCCAAGCTGGGCTGTGTGCACGAACCCCCCGTTCAGCCCGACCGCTGCGCCTTATCCGGTAACTATCGTCTTGAGTCCAACCCGGTAAGACACGACTTATCGCCACTGGCAGCAGCCACTGGTAAC';

const MCHERRY_COMPOSITE =
  'TAATACGACTCACTATAGGGAAAGAGGAGAAATACTAGATGGTGAGCAAGGGCGAGGAGGATAACATGGCCATCATCAAGGAGTTCATGCGCTTCAAGGTGCACATGGAGGGCTCCGTGAACGGCCACGAGTTCGAGATCGAGGGCGAGGGCGAGGGCCGCCCCTACGAGGGCACCCAGACCGCCAAGCTGAAGGTGACCAAGGGTGGCCCCCTGCCCTTCGCCTGGGACATCCTGTCCCCTCAGTTCATGTACGGCTCCAAGGCCTACGTGAAGCACCCCGCCGACATCCCCGACTACTTGAAGCTGTCCTTCCCCGAGGGCTTCAAGTGGGAGCGCGTGATGAACTTCGAGGACGGCGGCGTGGTGACCGTGACCCAGGACTCCTCCCTGCAGGACGGCGAGTTCATCTACAAGGTGAAGCTGCGCGGCACCAACTTCCCCTCCGACGGCCCCGTAATGCAGAAGAAGACCATGGGCTGGGAGGCCTCCTCCGAGCGGATGTACCCCGAGGACGGCGCCCTGAAGGGCGAGATCAAGCAGAGGCTGAAGCTGAAGGACGGCGGCCACTACGACGCTGAGGTCAAGACCACCTACAAGGCCAAGAAGCCCGTGCAGCTGCCCGGCGCCTACAACGTCAACATCAAGTTGGACATCACCTCCCACAACGAGGACTACACCATCGTGGAACAGTACGAACGCGCCGAGGGCCGCCACTCCACCGGCGGCATGGACGAGCTGTACAAGTAA';

const LUCIFERASE_ECOLI =
  'ATGGAAGACGCCAAAAACATAAAGAAAGGCCCGGCGCCATTCTATCCGCTGGAAGATGGAACCGCTGGAGAGCAACTGCATAAGGCTATGAAGAGATACGCCCTGGTTCCTGGAACAATTGCTTTTACAGATGCACATATCGAGGTGGACATCACTTACGCTGAGTACTTCGAAATGTCCGTTCGGTTGGCAGAAGCTATGAAACGATATGGGCTGAATACAAATCACAGAATCGTCGTATGCAGTGAAAACTCTCTTCAATTCTTTATGCCGGTGTTGGGCGCGTTATTTATCGGAGTTGCAGTTGCGCCCGCGAACGACATTTATAATGAACGTGAATTGCTCAACAGTATGGGTATTCCTCACCCTGATACCGATGTTGACCCCCCTTATCTCGAGAAGGGGCTCGCAATGATCCATGTTACCCCGGATTTCTTCATCAGTAATGATCATGAACTCTTTCAATTCAACATCACCGATGACGGCAAGATCGGCAAAGCAGTGATCCATAACATCTCTGAGAAGAACCTGATTGGACCTTTATGCCACATCGTATTCGTCCCCTCTAATTACGGCTTCCAAGCGAAAGGCTATCCAGCATTTACCGCCGCTAAGCATGGAATTGTCCACCCAGCGTTCCTGATGAACAAGCTGGGAGCAAACAGGTTTTCTCGTGGCGATGAAGCGTTTGCACAGCATCTCAATGCGTTCCCACTTCATGACTTTGAAGTTTCTATTGATTTTTCTAAGATCCTTATCGCTCTGATCGATCATAACTCATATCAGATCACTGGCATCTGCTAA';

const HUMAN_INSULIN = 'MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYCN';

const BRCA1_EXON =
  'ATGGATTTATCTGCTCTTCGCGTTGAAGAAGTACAAAATGTCATTAATGCTATGCAGAAAATCTTAGAGTGTCCCATCTGTCTGGAGTTGATCAAGGAACCTGTCTCCACAAAGTGTGACCACATATTTTGCAAATTTTGCATGCTGAAACTTCTCAACCAGAAGAAAGGGCCTTCACAGTGTCCTTTATGTAAGAATGATATAACCAAAAGGAGCCTACAAGAAAGTACGAGATTTAGTCAACTTGTTGAAGAGCTATTGAAAATCATTTGTGCTTTTCAGCTTGACACAGGTTTGGAGTATGCAAACAGCTATAATTTTGCAAAAAAGGAAAATAACTCTCCTGAACATCTAAAAGATGAAGTTTCTATCATCCAAAGTATGGGCTACAGAAACCGTGCCAAAAGACTTCTACAGAGTGAACCCGAAAATCCTTCCTTG';

const CAS9_GUIDE = 'GUUUUAGAGCUAGAAAUAGCAAGUUAAAAUAAGGCUAGUCCGUUAUCAACUUGAAAAAGUGGCACCGAGUCGGUGCUUUU';

const SPIDER_SILK = 'GGAGQGGYGGLGSQGAGRGGLGGQGAGAAAAAGGAGQGGYGGLGSQGAGRGGLGGQGAGAAAAAGGAGQGGYGGLGSQGAGRGGLGGQGAGAAAAAGGAGQGGYGGLGSQGAGRGGLGGQGAGAAAAAGGAGQGGYGGLGSQGAGRGGLGGQGAGAAAAAGGAGQGGYGGLGSQGAGRGGLGGQGAGAAAAAGGAGQGGYGGLGSQGAGRGGLGGQGAGAAAAAA';

const TRNA_PHE = 'GCGGAUUUAGCUCAGUUGGGAGAGCGCCAGACUGAAGAUCUGGAGGUCCUGUGUUCGAUCCACAGAAUUCGCACCA';

/** Readable labels for manipulation types used in derived block names */
const MANIPULATION_LABELS: Record<ManipulationType, string> = {
  reverse_complement: 'RC of',
  translate: 'Translation of',
  reverse_translate: 'RevTranslation of',
  codon_optimize: 'Codon-opt of',
  mutate: 'Mutation of',
  annotate: 'Annotated',
  auto_annotate: 'Auto-annotated',
};

/** Module-level guard so seeding survives React StrictMode unmount/remount */
let seeded = false;

export default function SequenceStack() {
  const [inputValue, setInputValue] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Show a brief notification banner that auto-dismisses with slide-out. */
  const showNotification = (msg: string) => {
    if (notificationTimer.current) clearTimeout(notificationTimer.current);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setDismissing(false);
    setNotification(msg);
    notificationTimer.current = setTimeout(() => {
      setDismissing(true);
      dismissTimer.current = setTimeout(() => {
        setNotification(null);
        setDismissing(false);
      }, 250);
    }, 3000);
  };

  // --- Zustand store selectors ---
  const activeConversationId = useUIStore((s) => s.activeConversationId);
  const conversation = useProjectStore((s) =>
    activeConversationId ? s.getConversation(activeConversationId) : undefined,
  );

  const activeBlockId = useUIStore((s) => s.activeSequenceBlockId);
  const selectSequenceBlock = useUIStore((s) => s.selectSequenceBlock);

  const allBlocks = useSequenceStore((s) => s.blocks);
  const addBlock = useSequenceStore((s) => s.addBlock);
  const removeBlock = useSequenceStore((s) => s.removeBlock);
  const updateBlockNotes = useSequenceStore((s) => s.updateBlockNotes);
  const updateBlockName = useSequenceStore((s) => s.updateBlockName);
  const setBlockFeatures = useSequenceStore((s) => s.setBlockFeatures);
  const setBlockAnalysis = useSequenceStore((s) => s.setBlockAnalysis);
  const setBlockParent = useSequenceStore((s) => s.setBlockParent);
  const getConversationBlocks = useSequenceStore((s) => s.getConversationBlocks);

  // Derive sorted blocks for the active conversation
  const blocks = activeConversationId ? getConversationBlocks(activeConversationId) : [];

  // --- Seed diverse sample data on first render ---
  const renameConv = useProjectStore((s) => s.renameConversation);

  useEffect(() => {
    if (seeded || !activeConversationId) return;
    const existing = getConversationBlocks(activeConversationId);
    if (existing.length > 0) return;

    seeded = true;

    // === Conversation 1: GFP Analysis (default/active) ===
    const gfpId = addBlock(activeConversationId, GFP_SEQ, 'eGFP (Enhanced Green Fluorescent Protein)');
    setBlockFeatures(gfpId, [
      { id: 'f1', name: 'eGFP ORF', type: 'orf', start: 0, end: 717, strand: 1, color: '#4ade80', metadata: {} },
      { id: 'f2', name: 'Start Codon', type: 'cds', start: 0, end: 3, strand: 1, color: '#22d3ee', metadata: {} },
      { id: 'f3', name: 'Chromophore', type: 'misc_feature', start: 195, end: 204, strand: 1, color: '#a78bfa', metadata: {} },
    ]);
    updateBlockNotes(gfpId, 'Wild-type eGFP from pEGFP-N1 vector. Codon-optimized for mammalian expression.');
    const proteinId = addBlock(activeConversationId, GFP_PROTEIN, 'eGFP Protein');
    setBlockParent(proteinId, gfpId, 'translate');
    renameConv(activeConversationId, 'GFP Analysis');
    selectSequenceBlock(gfpId);

    // === Conversation 2: CRISPR Components ===
    const crisprConvId = 'conv-crispr';
    const guideId = addBlock(crisprConvId, CAS9_GUIDE, 'Cas9 sgRNA scaffold');
    setBlockFeatures(guideId, [
      { id: 'cr1', name: 'Scaffold', type: 'misc_feature', start: 0, end: 76, strand: 1, color: '#a78bfa', metadata: {} },
    ]);
    updateBlockNotes(guideId, 'SpCas9 single guide RNA scaffold. Replace first 20nt with your target sequence.');

    // === Conversation 3: Cloning Vector ===
    const vectorConvId = 'conv-cloning';
    const pucId = addBlock(vectorConvId, PUC19_FRAGMENT, 'pUC19');
    setBlockFeatures(pucId, [
      { id: 'pu1', name: 'lacZ-alpha', type: 'gene', start: 396, end: 558, strand: 1, color: '#60a5fa', metadata: {} },
      { id: 'pu2', name: 'MCS', type: 'misc_feature', start: 396, end: 452, strand: 1, color: '#a78bfa', metadata: {} },
      { id: 'pu3', name: 'ampR', type: 'cds', start: 1629, end: 2489, strand: -1, color: '#fb7185', metadata: {} },
      { id: 'pu4', name: 'pMB1 ori', type: 'origin', start: 2634, end: 3252, strand: 1, color: '#22d3ee', metadata: {} },
    ]);
    updateBlockNotes(pucId, 'pUC19 high-copy cloning vector. 2686 bp, AmpR, lacZ-alpha for blue/white screening.');

    // === Conversation 4: Reporter Constructs ===
    const reporterConvId = 'conv-reporters';
    const mcherryId = addBlock(reporterConvId, MCHERRY_COMPOSITE, 'T7-RBS-mCherry');
    setBlockFeatures(mcherryId, [
      { id: 'mc1', name: 'T7 promoter', type: 'promoter', start: 0, end: 19, strand: 1, color: '#fbbf24', metadata: {} },
      { id: 'mc2', name: 'RBS', type: 'rbs', start: 20, end: 40, strand: 1, color: '#a78bfa', metadata: {} },
      { id: 'mc3', name: 'mCherry ORF', type: 'orf', start: 41, end: 752, strand: 1, color: '#fb7185', metadata: {} },
    ]);
    updateBlockNotes(mcherryId, 'mCherry red fluorescent protein with T7 promoter and RBS for bacterial expression.');

    const lucId = addBlock(reporterConvId, LUCIFERASE_ECOLI, 'Firefly Luciferase (E. coli optimized)');
    setBlockFeatures(lucId, [
      { id: 'lu1', name: 'Luc ORF', type: 'orf', start: 0, end: 1653, strand: 1, color: '#4ade80', metadata: {} },
    ]);
    updateBlockNotes(lucId, 'Firefly luciferase codon-optimized for E. coli expression. 551 aa.');

    // === Conversation 5: Human Genetics ===
    const humanConvId = 'conv-human';
    const insulinId = addBlock(humanConvId, HUMAN_INSULIN, 'Human Preproinsulin');
    setBlockFeatures(insulinId, [
      { id: 'hi1', name: 'Signal peptide', type: 'misc_feature', start: 0, end: 24, strand: 1, color: '#fbbf24', metadata: {} },
      { id: 'hi2', name: 'B chain', type: 'cds', start: 25, end: 54, strand: 1, color: '#60a5fa', metadata: {} },
      { id: 'hi3', name: 'C peptide', type: 'misc_feature', start: 57, end: 87, strand: 1, color: '#a78bfa', metadata: {} },
      { id: 'hi4', name: 'A chain', type: 'cds', start: 90, end: 110, strand: 1, color: '#4ade80', metadata: {} },
    ]);
    updateBlockNotes(insulinId, 'Human preproinsulin protein. Signal peptide cleaved to form proinsulin, then C-peptide excised.');

    const brca1Id = addBlock(humanConvId, BRCA1_EXON, 'BRCA1 Exon 11 Fragment');
    setBlockFeatures(brca1Id, [
      { id: 'br1', name: 'BRCA1 coding', type: 'cds', start: 0, end: 421, strand: 1, color: '#fb7185', metadata: {} },
    ]);
    updateBlockNotes(brca1Id, 'BRCA1 tumor suppressor exon 11 fragment. Key region for cancer-associated variants.');

    // === Conversation 6: Biomaterials ===
    const bioConvId = 'conv-biomaterials';
    const silkId = addBlock(bioConvId, SPIDER_SILK, 'Spider Silk Spidroin Repeat');
    setBlockFeatures(silkId, [
      { id: 'ss1', name: 'Repeat unit 1', type: 'misc_feature', start: 0, end: 42, strand: 1, color: '#22d3ee', metadata: {} },
      { id: 'ss2', name: 'Poly-A block', type: 'misc_feature', start: 35, end: 42, strand: 1, color: '#fbbf24', metadata: {} },
    ]);
    updateBlockNotes(silkId, 'Repetitive spidroin protein domain from spider dragline silk. GGAGQGGY and poly-alanine motifs.');

    const trnaId = addBlock(bioConvId, TRNA_PHE, 'tRNA-Phe (yeast)');
    updateBlockNotes(trnaId, 'Yeast phenylalanine tRNA. Classic cloverleaf structure, 76 nucleotides.');
  }, [
    activeConversationId,
    addBlock,
    getConversationBlocks,
    renameConv,
    selectSequenceBlock,
    setBlockFeatures,
    setBlockParent,
    updateBlockNotes,
  ]);

  // --- Helpers ---

  /** Resolve parent block name from parentBlockId */
  function getParentBlockName(parentBlockId: string | null): string | null {
    if (!parentBlockId) return null;
    const parent = allBlocks.find((b) => b.id === parentBlockId);
    return parent?.name ?? null;
  }

  const renameConversation = useProjectStore((s) => s.renameConversation);

  // --- Process file/pasted content by detecting format ---
  const processFileContent = (content: string, fileName?: string) => {
    if (!activeConversationId) return;
    const format = detectFileFormat(content);
    let count = 0;
    let lastBlockId = '';

    if (format === 'fasta') {
      const records = parseFasta(content);
      for (const rec of records) {
        const blockId = addBlock(activeConversationId, rec.sequence, rec.header || fileName);
        lastBlockId = blockId;
        count++;
      }
    } else if (format === 'genbank') {
      const records = parseGenBank(content);
      for (const rec of records) {
        const blockId = addBlock(activeConversationId, rec.sequence, rec.name || fileName);
        if (rec.features.length > 0) {
          setBlockFeatures(blockId, rec.features);
        }
        lastBlockId = blockId;
        count++;
      }
    } else {
      const clean = content.replace(/[\s\d]/g, '');
      if (clean.length > 0) {
        lastBlockId = addBlock(activeConversationId, clean, fileName);
        count++;
      }
    }

    if (lastBlockId) selectSequenceBlock(lastBlockId);
    if (count > 0) {
      showNotification(`Imported ${count} sequence${count !== 1 ? 's' : ''}`);
    } else {
      showNotification('No valid sequences found');
    }
  };

  // --- Input handler: paste/add a new sequence block ---
  const handlePaste = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !activeConversationId) return;

    processFileContent(trimmed);

    // Auto-rename conversation if it's still the default title
    if (conversation?.title === 'New Sequence Chat') {
      const currentBlocks = getConversationBlocks(activeConversationId);
      if (currentBlocks.length > 0) {
        renameConversation(activeConversationId, currentBlocks[currentBlocks.length - 1].name);
      }
    }

    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePaste();
    }
  };

  // --- Toolbar action handler for bio operations ---
  const handleAction = (block: typeof blocks[number], actionType: ManipulationType) => {
    if (!activeConversationId) return;

    const isDna = block.type === 'dna';
    const isRna = block.type === 'rna';
    const isNucleotide = isDna || isRna;
    const isProtein = block.type === 'protein';

    switch (actionType) {
      case 'reverse_complement': {
        if (!isNucleotide) {
          showNotification('Reverse complement requires a DNA or RNA sequence.');
          return;
        }
        const rc = reverseComplement(block.raw, isRna);
        const name = `${MANIPULATION_LABELS.reverse_complement} ${block.name}`;
        const newId = addBlock(activeConversationId, rc, name);
        setBlockParent(newId, block.id, 'reverse_complement');
        selectSequenceBlock(newId);
        showNotification(`Created reverse complement (${rc.length} bp)`);
        break;
      }

      case 'translate': {
        if (!isNucleotide) {
          showNotification('Translate requires a DNA or RNA sequence.');
          return;
        }
        const protein = translate(block.raw);
        const name = `${MANIPULATION_LABELS.translate} ${block.name}`;
        const newId = addBlock(activeConversationId, protein, name);
        setBlockParent(newId, block.id, 'translate');
        selectSequenceBlock(newId);
        showNotification(`Translated to protein (${protein.length} aa)`);
        break;
      }

      case 'reverse_translate': {
        if (!isProtein) {
          showNotification('Reverse translate requires a protein sequence.');
          return;
        }
        const dna = reverseTranslate(block.raw);
        const name = `${MANIPULATION_LABELS.reverse_translate} ${block.name}`;
        const newId = addBlock(activeConversationId, dna, name);
        setBlockParent(newId, block.id, 'reverse_translate');
        selectSequenceBlock(newId);
        showNotification(`Reverse translated to DNA (${dna.length} bp)`);
        break;
      }

      case 'codon_optimize': {
        if (!isNucleotide) {
          showNotification('Codon optimize requires a DNA or RNA sequence.');
          return;
        }
        const optimized = codonOptimize(block.raw, 'ecoli');
        const name = `${MANIPULATION_LABELS.codon_optimize} ${block.name}`;
        const newId = addBlock(activeConversationId, optimized, name);
        setBlockParent(newId, block.id, 'codon_optimize');
        selectSequenceBlock(newId);
        showNotification(`Codon optimized for E. coli (${optimized.length} bp)`);
        break;
      }

      case 'annotate':
      case 'auto_annotate': {
        if (!isNucleotide) {
          showNotification('Auto-annotation requires a DNA or RNA sequence.');
          return;
        }
        // Annotate in-place: compute features + analysis and set them on the same block
        const analysis = autoAnnotate(block.raw);
        const features = annotateToFeatures(block.raw);
        setBlockFeatures(block.id, features);
        setBlockAnalysis(block.id, analysis);
        showNotification(`Found ${features.length} feature${features.length !== 1 ? 's' : ''} — ORFs, restriction sites, and more`);
        break;
      }

      case 'mutate': {
        // Mutation requires additional UI for parameters (position, base, etc.)
        showNotification('Mutation editor coming soon — specify position, base, and type.');
        break;
      }

      default: {
        console.warn(`Unknown toolbar action: ${actionType}`);
      }
    }
  };

  // --- No active conversation: prompt user to select one ---
  if (!activeConversationId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <EmptyState />
        <div
          style={{
            padding: '0 40px 40px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          Select or create a conversation from the sidebar to begin.
        </div>
      </div>
    );
  }

  // --- Render ---

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }}
      onDrop={(e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        for (const file of files) {
          const reader = new FileReader();
          reader.onload = () => { if (typeof reader.result === 'string') processFileContent(reader.result, file.name.replace(/\.[^.]+$/, '')); };
          reader.readAsText(file);
        }
      }}
    >

      {/* Drop overlay */}
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--accent-subtle)',
            border: '2px dashed var(--accent)',
            borderRadius: 'var(--radius-lg)',
            margin: 8,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--accent)' }}>
            Drop .fasta or .gb files here
          </div>
        </div>
      )}

      {/* Notification banner */}
      {notification && (
        <div
          style={{
            margin: '0 24px 8px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(250,204,21,0.10)',
            border: '1px solid rgba(250,204,21,0.25)',
            color: 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 500,
            animation: dismissing
              ? 'notifySlideOut 0.25s ease forwards'
              : 'notifySlideIn 0.25s ease',
          }}
        >
          {notification}
        </div>
      )}

      {/* Blocks or empty state */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px 16px' }}>
        {blocks.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 768, margin: '0 auto' }}>
            {blocks.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8, position: 'relative' }}>
                <button
                  onClick={() => setExportMenuOpen(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 8px', background: 'transparent',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)', fontSize: 11, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-accent)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Download size={12} />
                  Export
                </button>
                {exportMenuOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setExportMenuOpen(false)} />
                    <div style={{
                      position: 'absolute', right: 0, top: '100%', marginTop: 4,
                      background: 'var(--bg-primary)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)',
                      zIndex: 20, minWidth: 180, overflow: 'hidden',
                    }}>
                      <button
                        onClick={() => {
                          const content = exportToFasta(blocks);
                          const filename = `${(conversation?.title || 'sequences').replace(/[^a-zA-Z0-9_.-]/g, '_')}.fasta`;
                          downloadFile(content, filename, 'text/plain');
                          setExportMenuOpen(false);
                          showNotification('Exported all sequences as FASTA');
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-sans)', cursor: 'pointer', textAlign: 'left' as const }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                      >
                        Export All as FASTA
                      </button>
                      <button
                        onClick={() => {
                          if (!conversation) return;
                          const content = exportToMarkdown(conversation, blocks);
                          const filename = `${conversation.title.replace(/[^a-zA-Z0-9_.-]/g, '_')}.md`;
                          downloadFile(content, filename, 'text/markdown');
                          setExportMenuOpen(false);
                          showNotification('Exported conversation as Markdown');
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-sans)', cursor: 'pointer', textAlign: 'left' as const }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                      >
                        Export All as Markdown
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            {blocks.map((b) => (
              <div key={b.id} onClick={() => selectSequenceBlock(b.id)}>
                <SequenceBlock
                  id={b.id}
                  name={b.name}
                  raw={b.raw}
                  type={b.type}
                  topology={b.topology}
                  features={b.features}
                  notes={b.notes}
                  isActive={b.id === activeBlockId}
                  parentBlockName={getParentBlockName(b.parentBlockId)}
                  manipulation={b.manipulation}
                  onNotesChange={(notes) => updateBlockNotes(b.id, notes)}
                  onNameChange={(name) => updateBlockName(b.id, name)}
                  onAction={(type) => handleAction(b, type)}
                  onDelete={() => removeBlock(b.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <div
        style={{
          padding: '12px 24px 16px',
          maxWidth: 768 + 48,
          margin: '0 auto',
          width: '100%',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: '8px 8px 8px 16px',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-accent)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste a sequence or ask about molecular biology..."
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontFamily: 'var(--font-sans)',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.5,
              maxHeight: 120,
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'color 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            title="Upload file"
          >
            <Upload size={16} />
          </button>
          <button
            onClick={handlePaste}
            disabled={!inputValue.trim()}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: inputValue.trim() ? 'var(--accent)' : 'var(--bg-tertiary)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputValue.trim() ? 'pointer' : 'default',
              transition: 'background 0.15s ease',
              flexShrink: 0,
            }}
          >
            <ArrowUp
              size={18}
              style={{
                color: inputValue.trim() ? 'var(--bg-deep)' : 'var(--text-muted)',
              }}
            />
          </button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".fasta,.fa,.fna,.gb,.gbk,.genbank,.txt"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          for (const file of files) {
            const reader = new FileReader();
            reader.onload = () => { if (typeof reader.result === 'string') processFileContent(reader.result, file.name.replace(/\.[^.]+$/, '')); };
            reader.readAsText(file);
          }
          e.target.value = '';
        }}
      />
    </div>
  );
}
