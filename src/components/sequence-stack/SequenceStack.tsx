import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { ArrowUp, Upload, Download, X, Undo2, Link2, GitCompare } from 'lucide-react';
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
  getCodonUsage,
} from '../../bio';
import type { ManipulationType, Feature } from '../../bio/types';
import type { SequenceBlock as SequenceBlockType } from '../../store/types';
import { exportToFasta, exportToMarkdown, exportToGenBank, downloadFile } from '../../persistence/export';
const DigestDialog = lazy(() => import('./DigestDialog'));
const LigationDialog = lazy(() => import('./LigationDialog'));
const PrimerDesignDialog = lazy(() => import('./PrimerDesignDialog'));
const SequenceDiffView = lazy(() => import('./SequenceDiffView'));
import type { DigestFragment } from '../../bio/restriction-digest';
import { validateAndCleanSequence } from '../../bio/validate-sequence';

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
  reverse_translate_rna: 'RevTranslation (RNA) of',
  codon_optimize: 'Codon-opt of',
  mutate: 'Mutation of',
  annotate: 'Annotated',
  auto_annotate: 'Auto-annotated',
  restriction_digest: 'Digest fragment of',
  ligate: 'Ligation of',
  design_primers: 'Primers for',
  extract: 'Extract from',
};

/** Module-level guard so seeding survives React StrictMode unmount/remount */
let seeded = false;

export default function SequenceStack() {
  const [inputValue, setInputValue] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [deletedBlock, setDeletedBlock] = useState<SequenceBlockType | null>(null);
  const [digestDialogBlock, setDigestDialogBlock] = useState<SequenceBlockType | null>(null);
  const [ligationDialogOpen, setLigationDialogOpen] = useState(false);
  const [primerDesignBlock, setPrimerDesignBlock] = useState<SequenceBlockType | null>(null);
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [confirmingBatchDelete, setConfirmingBatchDelete] = useState(false);
  const [deletedBatch, setDeletedBatch] = useState<SequenceBlockType[] | null>(null);
  const [dragState, setDragState] = useState<{ blockId: string; startY: number; currentY: number; dropIndex: number } | null>(null);
  const blockRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const batchDeleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const batchUndoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const selectedBlockIds = useUIStore((s) => s.selectedBlockIds);
  const toggleBlockSelection = useUIStore((s) => s.toggleBlockSelection);
  const clearBlockSelection = useUIStore((s) => s.clearBlockSelection);

  const allBlocks = useSequenceStore((s) => s.blocks);
  const addBlock = useSequenceStore((s) => s.addBlock);
  const removeBlock = useSequenceStore((s) => s.removeBlock);
  const restoreBlock = useSequenceStore((s) => s.restoreBlock);
  const updateBlockNotes = useSequenceStore((s) => s.updateBlockNotes);
  const updateBlockName = useSequenceStore((s) => s.updateBlockName);
  const setBlockFeatures = useSequenceStore((s) => s.setBlockFeatures);
  const addFeature = useSequenceStore((s) => s.addFeature);
  const updateFeature = useSequenceStore((s) => s.updateFeature);
  const removeFeature = useSequenceStore((s) => s.removeFeature);
  const setBlockAnalysis = useSequenceStore((s) => s.setBlockAnalysis);
  const setBlockParent = useSequenceStore((s) => s.setBlockParent);
  const getConversationBlocks = useSequenceStore((s) => s.getConversationBlocks);
  const reorderBlocks = useSequenceStore((s) => s.reorderBlocks);

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

  // Soft-delete: stash block, remove, show undo notification
  const handleSoftDelete = useCallback((blockId: string) => {
    const block = allBlocks.find((b) => b.id === blockId);
    if (!block) return;
    setDeletedBlock(block);
    removeBlock(blockId);
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    deleteTimer.current = setTimeout(() => setDeletedBlock(null), 5000);
  }, [allBlocks, removeBlock]);

  const handleUndoDelete = useCallback(() => {
    if (!deletedBlock) return;
    restoreBlock(deletedBlock);
    selectSequenceBlock(deletedBlock.id);
    setDeletedBlock(null);
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
  }, [deletedBlock, restoreBlock, selectSequenceBlock]);

  // Navigate to parent block
  const handleNavigateToParent = useCallback((blockId: string) => {
    selectSequenceBlock(blockId);
    // Scroll into view
    setTimeout(() => {
      document.querySelector(`[data-block-id="${blockId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }, [selectSequenceBlock]);

  // Cmd+F → open sequence search
  const openSequenceSearch = useUIStore((s) => s.openSequenceSearch);
  useEffect(() => {
    if (!activeBlockId || !activeConversationId) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        openSequenceSearch();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activeBlockId, activeConversationId, openSequenceSearch]);

  // Global keyboard shortcuts for transforms on active block
  useEffect(() => {
    if (!activeBlockId || !activeConversationId) return;

    const handler = (e: KeyboardEvent) => {
      const metaOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd+/ — toggle shortcut legend (no Shift required)
      if (metaOrCtrl && e.key === '/') {
        e.preventDefault();
        useUIStore.getState().toggleShortcutLegend();
        return;
      }

      if (!metaOrCtrl || !e.shiftKey) return;

      const block = allBlocks.find((b) => b.id === activeBlockId);
      if (!block) return;

      // Cmd+Shift+R: Reverse Complement
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleAction(block, 'reverse_complement');
        return;
      }
      // Cmd+Shift+T: Translate
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleAction(block, 'translate');
        return;
      }
      // Cmd+Shift+O: Codon Optimize
      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        handleAction(block, 'codon_optimize');
        return;
      }
      // Cmd+Shift+E: Auto Annotate
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handleAction(block, 'auto_annotate');
        return;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- handleAction reads current state via store; adding it would cause unnecessary re-registration
  }, [activeBlockId, activeConversationId, allBlocks]);

  // Reset batch delete confirmation when selection changes
  useEffect(() => {
    setConfirmingBatchDelete(false);
    if (batchDeleteTimer.current) clearTimeout(batchDeleteTimer.current);
  }, [selectedBlockIds]);

  // --- Process file/pasted content by detecting format ---
  const processFileContent = (content: string, fileName?: string) => {
    if (!activeConversationId) return;
    const format = detectFileFormat(content);
    let count = 0;
    let lastBlockId = '';

    if (format === 'fasta') {
      const records = parseFasta(content);
      for (const rec of records) {
        const { cleaned, invalidCount, invalidChars } = validateAndCleanSequence(rec.sequence);
        if (cleaned.length === 0) {
          showNotification('No valid sequence characters found');
          continue;
        }
        if (invalidCount > 0) {
          const s = invalidCount !== 1 ? 's' : '';
          const chars = invalidChars.slice(0, 5).join(', ');
          showNotification(`Removed ${invalidCount} invalid character${s} (${chars})`);
        }
        const blockId = addBlock(activeConversationId, cleaned, rec.header || fileName);
        lastBlockId = blockId;
        count++;
      }
    } else if (format === 'genbank') {
      const records = parseGenBank(content);
      for (const rec of records) {
        const { cleaned, invalidCount, invalidChars } = validateAndCleanSequence(rec.sequence);
        if (cleaned.length === 0) {
          showNotification('No valid sequence characters found');
          continue;
        }
        if (invalidCount > 0) {
          const s = invalidCount !== 1 ? 's' : '';
          const chars = invalidChars.slice(0, 5).join(', ');
          showNotification(`Removed ${invalidCount} invalid character${s} (${chars})`);
        }
        const blockId = addBlock(activeConversationId, cleaned, rec.name || fileName);
        if (rec.features.length > 0) {
          setBlockFeatures(blockId, rec.features);
        }
        lastBlockId = blockId;
        count++;
      }
    } else {
      const { cleaned, invalidCount, invalidChars } = validateAndCleanSequence(content);
      if (cleaned.length > 0) {
        if (invalidCount > 0) {
          const s = invalidCount !== 1 ? 's' : '';
          const chars = invalidChars.slice(0, 5).join(', ');
          showNotification(`Removed ${invalidCount} invalid character${s} (${chars})`);
        }
        lastBlockId = addBlock(activeConversationId, cleaned, fileName);
        count++;
      } else if (content.replace(/[\s\d]/g, '').length > 0) {
        showNotification('No valid sequence characters found');
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

    // Read selection range for range-aware transforms
    const selectedRange = useUIStore.getState().selectedRange;

    const isDna = block.type === 'dna';
    const isRna = block.type === 'rna';
    const isNucleotide = isDna || isRna;
    const isProtein = block.type === 'protein';

    // Build range label and input sequence for transforms that produce new blocks
    const rangeLabel = selectedRange
      ? ` [${selectedRange.start + 1}..${selectedRange.end}]`
      : '';
    const inputSeq = selectedRange
      ? block.raw.slice(selectedRange.start, selectedRange.end)
      : block.raw;

    switch (actionType) {
      case 'reverse_complement': {
        if (!isNucleotide) {
          showNotification('Reverse complement requires a DNA or RNA sequence.');
          return;
        }
        const rc = reverseComplement(inputSeq, isRna);
        const name = `${MANIPULATION_LABELS.reverse_complement} ${block.name}${rangeLabel}`;
        const newId = addBlock(activeConversationId, rc, name);
        setBlockParent(newId, block.id, 'reverse_complement');
        selectSequenceBlock(newId);
        useUIStore.getState().setSelectedRange(null);
        if (selectedRange) {
          showNotification(`Created reverse complement of bases ${selectedRange.start + 1}-${selectedRange.end} (${rc.length} bp)`);
        } else {
          showNotification(`Created reverse complement (${rc.length} bp)`);
        }
        break;
      }

      case 'translate': {
        if (!isNucleotide) {
          showNotification('Translate requires a DNA or RNA sequence.');
          return;
        }
        const frame = useUIStore.getState().translationFrame;
        const protein = translate(inputSeq, frame);
        const frameLabel = frame > 0 ? ` (frame +${frame + 1})` : '';
        const name = `${MANIPULATION_LABELS.translate}${frameLabel} ${block.name}${rangeLabel}`;
        const newId = addBlock(activeConversationId, protein, name);
        setBlockParent(newId, block.id, 'translate');
        selectSequenceBlock(newId);
        useUIStore.getState().setSelectedRange(null);
        if (selectedRange) {
          showNotification(`Translated bases ${selectedRange.start + 1}-${selectedRange.end}${frameLabel} to protein (${protein.length} aa)`);
        } else {
          showNotification(`Translated${frameLabel} to protein (${protein.length} aa)`);
        }
        break;
      }

      case 'reverse_translate': {
        if (!isProtein) {
          showNotification('Reverse translate requires a protein sequence.');
          return;
        }
        const codonTableSetting = useUIStore.getState().codonTable;
        const usage = getCodonUsage(codonTableSetting);
        const dna = reverseTranslate(inputSeq, usage);
        const organism = codonTableSetting === 'ecoli' ? 'E. coli' : codonTableSetting === 'human' ? 'Human' : 'Yeast';
        const name = `${MANIPULATION_LABELS.reverse_translate} ${block.name}${rangeLabel}`;
        const newId = addBlock(activeConversationId, dna, name);
        setBlockParent(newId, block.id, 'reverse_translate');
        selectSequenceBlock(newId);
        useUIStore.getState().setSelectedRange(null);
        if (selectedRange) {
          showNotification(`Reverse translated residues ${selectedRange.start + 1}-${selectedRange.end} to DNA (${organism}) (${dna.length} bp)`);
        } else {
          showNotification(`Reverse translated to DNA (${organism}) (${dna.length} bp)`);
        }
        break;
      }

      case 'reverse_translate_rna': {
        if (!isProtein) {
          showNotification('Reverse translate requires a protein sequence.');
          return;
        }
        const codonTableSettingRna = useUIStore.getState().codonTable;
        const usageRna = getCodonUsage(codonTableSettingRna);
        const dnaForRna = reverseTranslate(inputSeq, usageRna);
        const rna = dnaForRna.replace(/T/g, 'U');
        const organismRna = codonTableSettingRna === 'ecoli' ? 'E. coli' : codonTableSettingRna === 'human' ? 'Human' : 'Yeast';
        const nameRna = `${MANIPULATION_LABELS.reverse_translate_rna} ${block.name}${rangeLabel}`;
        const newIdRna = addBlock(activeConversationId, rna, nameRna);
        setBlockParent(newIdRna, block.id, 'reverse_translate_rna');
        selectSequenceBlock(newIdRna);
        useUIStore.getState().setSelectedRange(null);
        if (selectedRange) {
          showNotification(`Reverse translated residues ${selectedRange.start + 1}-${selectedRange.end} to RNA (${organismRna}) (${rna.length} nt)`);
        } else {
          showNotification(`Reverse translated to RNA (${organismRna}) (${rna.length} nt)`);
        }
        break;
      }

      case 'codon_optimize': {
        if (!isNucleotide) {
          showNotification('Codon optimize requires a DNA or RNA sequence.');
          return;
        }
        const codonTableOpt = useUIStore.getState().codonTable;
        const optimized = codonOptimize(inputSeq, codonTableOpt);
        const organismOpt = codonTableOpt === 'ecoli' ? 'E. coli' : codonTableOpt === 'human' ? 'Human' : 'Yeast';
        const name = `${MANIPULATION_LABELS.codon_optimize} ${block.name}${rangeLabel}`;
        const newId = addBlock(activeConversationId, optimized, name);
        setBlockParent(newId, block.id, 'codon_optimize');
        selectSequenceBlock(newId);
        useUIStore.getState().setSelectedRange(null);
        if (selectedRange) {
          showNotification(`Codon optimized bases ${selectedRange.start + 1}-${selectedRange.end} for ${organismOpt} (${optimized.length} bp)`);
        } else {
          showNotification(`Codon optimized for ${organismOpt} (${optimized.length} bp)`);
        }
        break;
      }

      case 'annotate':
      case 'auto_annotate': {
        if (!isNucleotide) {
          showNotification('Auto-annotation requires a DNA or RNA sequence.');
          return;
        }
        // Annotate in-place on the full sequence (ignore selection)
        const analysis = autoAnnotate(block.raw);
        const features = annotateToFeatures(block.raw);
        setBlockFeatures(block.id, features);
        setBlockAnalysis(block.id, analysis);
        showNotification(`Found ${features.length} feature${features.length !== 1 ? 's' : ''} — ORFs, restriction sites, and more`);
        break;
      }

      case 'mutate': {
        // Activate editing on the block with cursor at selection start
        const startPos = selectedRange?.start ?? 0;
        useUIStore.getState().activateEditing(block.id, startPos);
        showNotification('Click any base to position cursor — type to substitute, toggle INS for insert mode');
        break;
      }

      case 'restriction_digest': {
        if (!isNucleotide) {
          showNotification('Restriction digest requires a DNA or RNA sequence.');
          return;
        }
        setDigestDialogBlock(block);
        break;
      }

      case 'design_primers': {
        if (!isNucleotide) {
          showNotification('Primer design requires a DNA or RNA sequence.');
          return;
        }
        setPrimerDesignBlock(block);
        break;
      }

      case 'ligate': {
        // handled at conversation level
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
          data-testid="notification"
          style={{
            margin: '0 24px 8px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(250,204,21,0.10)',
            border: '1px solid rgba(250,204,21,0.25)',
            color: 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: 'var(--shadow-sm)',
            animation: dismissing
              ? 'notifySlideOut 0.25s ease forwards'
              : 'notifySlideIn 0.25s ease',
          }}
        >
          <span style={{ flex: 1 }}>{notification}</span>
          <button
            onClick={() => {
              if (notificationTimer.current) clearTimeout(notificationTimer.current);
              setDismissing(true);
              dismissTimer.current = setTimeout(() => {
                setNotification(null);
                setDismissing(false);
              }, 250);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 2,
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            aria-label="Dismiss notification"
            title="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Undo delete banner */}
      {deletedBlock && (
        <div
          style={{
            margin: '0 24px 8px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: 'var(--shadow-sm)',
            animation: 'notifySlideIn 0.25s ease',
          }}
        >
          <span style={{ flex: 1 }}>Deleted "{deletedBlock.name}"</span>
          <button
            onClick={handleUndoDelete}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--danger-text)',
              cursor: 'pointer',
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
            }}
          >
            <Undo2 size={11} />
            Undo
          </button>
          <button
            onClick={() => { setDeletedBlock(null); if (deleteTimer.current) clearTimeout(deleteTimer.current); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 2,
              flexShrink: 0,
            }}
            aria-label="Dismiss undo notification"
            title="Dismiss undo notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Batch undo delete banner */}
      {deletedBatch && (
        <div style={{
          margin: '0 24px 8px',
          padding: '8px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          color: 'var(--text-secondary)',
          fontSize: 12,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: 'var(--shadow-sm)',
          animation: 'notifySlideIn 0.25s ease',
        }}>
          <span style={{ flex: 1 }}>Deleted {deletedBatch.length} blocks</span>
          <button
            onClick={() => {
              for (const block of deletedBatch) restoreBlock(block);
              setDeletedBatch(null);
              if (batchUndoTimer.current) clearTimeout(batchUndoTimer.current);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--danger-text)',
              cursor: 'pointer', padding: '3px 8px', fontSize: 11,
              fontWeight: 600, fontFamily: 'var(--font-sans)',
            }}
          >
            <Undo2 size={11} />
            Undo
          </button>
          <button
            onClick={() => { setDeletedBatch(null); if (batchUndoTimer.current) clearTimeout(batchUndoTimer.current); }}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center',
              borderRadius: 2, flexShrink: 0,
            }}
            aria-label="Dismiss undo notification"
            title="Dismiss undo notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Blocks or empty state */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px 16px' }}>
        {blocks.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960, margin: '0 auto' }}>
            {blocks.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8, position: 'relative', gap: 6 }}>
                {/* Ligate button — visible when 2+ DNA blocks exist */}
                {blocks.filter(b => b.type === 'dna').length >= 2 && (
                  <button
                    onClick={() => setLigationDialogOpen(true)}
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
                    <Link2 size={12} />
                    Ligate
                  </button>
                )}
                {/* Compare button — visible when 2+ blocks exist */}
                {blocks.length >= 2 && (
                  <button
                    onClick={() => setDiffDialogOpen(true)}
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
                    <GitCompare size={12} />
                    Compare
                  </button>
                )}
                <button
                  data-testid="export-button"
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
                      animation: 'menuFadeIn 0.15s ease', transformOrigin: 'top right',
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
                      <button
                        onClick={() => {
                          const content = blocks.map(b => {
                            const blockData = { id: b.id, name: b.name, notes: '', raw: b.raw, type: b.type, topology: b.topology, features: b.features, analysis: null, scars: [], conversationId: '', parentBlockId: null, manipulation: null, position: 0, createdAt: 0 };
                            return exportToGenBank(blockData);
                          }).join('\n');
                          const filename = `${(conversation?.title || 'sequences').replace(/[^a-zA-Z0-9_.-]/g, '_')}.gb`;
                          downloadFile(content, filename, 'text/plain');
                          setExportMenuOpen(false);
                          showNotification('Exported all sequences as GenBank');
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-sans)', cursor: 'pointer', textAlign: 'left' as const }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                      >
                        Export All as GenBank
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            {selectedBlockIds.size > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                background: 'var(--accent-subtle)', border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-md)', marginBottom: 8,
                animation: 'menuFadeIn 0.15s ease',
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>
                  {selectedBlockIds.size} selected
                </span>
                <div style={{ flex: 1 }} />
                <button onClick={() => {
                  const selected = blocks.filter(b => selectedBlockIds.has(b.id));
                  const content = exportToFasta(selected);
                  const filename = 'selected_sequences.fasta';
                  downloadFile(content, filename, 'text/plain');
                }} style={{
                  padding: '3px 8px', fontSize: 11, fontWeight: 500, background: 'none',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}>
                  Export FASTA
                </button>
                <button onClick={() => {
                  if (confirmingBatchDelete) {
                    if (batchDeleteTimer.current) clearTimeout(batchDeleteTimer.current);
                    const deletedBlocks = blocks.filter(b => selectedBlockIds.has(b.id));
                    for (const bid of selectedBlockIds) removeBlock(bid);
                    clearBlockSelection();
                    setConfirmingBatchDelete(false);
                    setDeletedBatch(deletedBlocks);
                    if (batchUndoTimer.current) clearTimeout(batchUndoTimer.current);
                    batchUndoTimer.current = setTimeout(() => setDeletedBatch(null), 5000);
                  } else {
                    setConfirmingBatchDelete(true);
                    batchDeleteTimer.current = setTimeout(() => setConfirmingBatchDelete(false), 3000);
                  }
                }} style={{
                  padding: '3px 8px', fontSize: 11, fontWeight: confirmingBatchDelete ? 600 : 500,
                  background: confirmingBatchDelete ? 'var(--danger-bg)' : 'none',
                  border: '1px solid var(--rose)', borderRadius: 'var(--radius-sm)',
                  color: 'var(--rose)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}>
                  {confirmingBatchDelete ? 'Really delete?' : 'Delete'}
                </button>
                <button onClick={() => clearBlockSelection()} style={{
                  padding: '3px 8px', fontSize: 11, fontWeight: 500, background: 'none',
                  border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}>
                  Clear
                </button>
              </div>
            )}
            {blocks.map((b, idx) => {
              const isDragged = dragState?.blockId === b.id;
              const dragIdx = dragState ? blocks.findIndex(bl => bl.id === dragState.blockId) : -1;
              const showIndicatorBefore = dragState && dragState.dropIndex === idx && dragState.dropIndex !== dragIdx && dragState.dropIndex !== dragIdx + 1;
              const showIndicatorAfter = dragState && idx === blocks.length - 1 && dragState.dropIndex === blocks.length && dragState.dropIndex !== dragIdx && dragState.dropIndex !== dragIdx + 1;

              return (
                <div key={b.id}>
                  {showIndicatorBefore && (
                    <div style={{
                      height: 2,
                      background: 'var(--accent)',
                      borderRadius: 1,
                      margin: '-1px 0 -1px 0',
                      marginBottom: 19,
                    }} />
                  )}
                  <div
                    data-block-id={b.id}
                    ref={(el) => {
                      if (el) blockRefsMap.current.set(b.id, el);
                      else blockRefsMap.current.delete(b.id);
                    }}
                    onClick={(e) => {
                      if (e.shiftKey) {
                        toggleBlockSelection(b.id);
                      } else {
                        if (selectedBlockIds.size > 0) clearBlockSelection();
                        selectSequenceBlock(b.id);
                      }
                    }}
                    style={{
                      opacity: isDragged ? 0.5 : 1,
                      transition: isDragged ? 'none' : 'opacity 0.15s',
                      touchAction: 'none',
                    }}
                    onPointerDown={(e) => {
                      const target = e.target as HTMLElement;
                      if (!target.closest('[data-drag-handle="true"]')) return;
                      e.preventDefault();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setDragState({ blockId: b.id, startY: e.clientY, currentY: e.clientY, dropIndex: idx });
                    }}
                    onPointerMove={(e) => {
                      if (!dragState || dragState.blockId !== b.id) return;
                      const currentY = e.clientY;
                      // Compute drop index by comparing Y against block midpoints
                      let dropIndex = 0;
                      for (let i = 0; i < blocks.length; i++) {
                        const el = blockRefsMap.current.get(blocks[i].id);
                        if (!el) continue;
                        const rect = el.getBoundingClientRect();
                        const midY = rect.top + rect.height / 2;
                        if (currentY > midY) {
                          dropIndex = i + 1;
                        }
                      }
                      setDragState({ ...dragState, currentY, dropIndex });
                    }}
                    onPointerUp={() => {
                      if (!dragState || dragState.blockId !== b.id) return;
                      if (activeConversationId) {
                        const fromIndex = blocks.findIndex(bl => bl.id === dragState.blockId);
                        const toIndex = dragState.dropIndex;
                        // Only reorder if the position actually changed
                        if (fromIndex !== toIndex && fromIndex + 1 !== toIndex) {
                          const newBlockIds = blocks.map(bl => bl.id);
                          newBlockIds.splice(fromIndex, 1);
                          const adjustedTo = toIndex > fromIndex ? toIndex - 1 : toIndex;
                          newBlockIds.splice(adjustedTo, 0, dragState.blockId);
                          reorderBlocks(activeConversationId, newBlockIds);
                        }
                      }
                      setDragState(null);
                    }}
                    onLostPointerCapture={() => {
                      // Safety: clean up drag state if pointer capture is lost (e.g., pointer released outside window)
                      if (dragState?.blockId === b.id) setDragState(null);
                    }}
                  >
                    <SequenceBlock
                      id={b.id}
                      name={b.name}
                      raw={b.raw}
                      type={b.type}
                      topology={b.topology}
                      features={b.features}
                      notes={b.notes}
                      scars={b.scars ?? []}
                      isActive={b.id === activeBlockId}
                      parentBlockId={b.parentBlockId}
                      parentBlockName={getParentBlockName(b.parentBlockId)}
                      manipulation={b.manipulation}
                      onNotesChange={(notes) => updateBlockNotes(b.id, notes)}
                      onNameChange={(name) => updateBlockName(b.id, name)}
                      onAction={(type) => handleAction(b, type)}
                      onDuplicate={() => {
                        if (!activeConversationId) return;
                        const newId = addBlock(activeConversationId, b.raw, b.name + ' (copy)');
                        if (b.features.length > 0) {
                          setBlockFeatures(newId, (JSON.parse(JSON.stringify(b.features)) as Feature[]).map((f) => ({ ...f, id: crypto.randomUUID() })));
                        }
                        setBlockParent(newId, b.id, 'extract');
                        selectSequenceBlock(newId);
                        showNotification(`Duplicated "${b.name}"`);
                      }}
                      onDelete={() => handleSoftDelete(b.id)}
                      onNavigateToParent={handleNavigateToParent}
                      onAddFeature={(f) => addFeature(b.id, f)}
                      onUpdateFeature={(fId, updates) => updateFeature(b.id, fId, updates)}
                      onRemoveFeature={(fId) => removeFeature(b.id, fId)}
                      onExtractSelection={(start, end) => {
                        if (!activeConversationId) return;
                        const substring = b.raw.slice(start, end);
                        // Preserve overlapping features shifted to 0-based
                        const shiftedFeatures = b.features
                          .filter((f) => f.start < end && f.end > start)
                          .map((f) => ({
                            ...f,
                            id: crypto.randomUUID(),
                            start: Math.max(0, f.start - start),
                            end: Math.min(end - start, f.end - start),
                          }));
                        const extractName = `Extract from ${b.name} [${start + 1}..${end}]`;
                        const newId = addBlock(activeConversationId, substring, extractName);
                        setBlockParent(newId, b.id, 'extract');
                        if (shiftedFeatures.length > 0) {
                          setBlockFeatures(newId, shiftedFeatures);
                        }
                        selectSequenceBlock(newId);
                        showNotification(`Extracted ${substring.length} ${b.type === 'protein' ? 'aa' : 'bp'} from ${b.name}`);
                      }}
                    />
                  </div>
                  {showIndicatorAfter && (
                    <div style={{
                      height: 2,
                      background: 'var(--accent)',
                      borderRadius: 1,
                      margin: '-1px 0',
                      marginTop: 19,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input area */}
      <div
        style={{
          padding: '12px 24px 16px',
          maxWidth: 960 + 48,
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
            data-testid="sequence-input"
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
            aria-label="Upload file"
          >
            <Upload size={16} />
          </button>
          <button
            data-testid="submit-sequence"
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
            aria-label="Submit sequence"
            title="Submit sequence"
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
        data-testid="file-upload"
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

      <Suspense fallback={null}>
      {/* Restriction Digest Dialog */}
      {digestDialogBlock && (
        <DigestDialog
          sequence={digestDialogBlock.raw}
          sequenceName={digestDialogBlock.name}
          topology={digestDialogBlock.topology}
          onDigest={(fragments: DigestFragment[]) => {
            if (!activeConversationId) return;
            for (let i = 0; i < fragments.length; i++) {
              const frag = fragments[i];
              const enzLabel = [frag.leftEnzyme, frag.rightEnzyme].filter(Boolean).join('–');
              const fragName = `Fragment ${i + 1}${enzLabel ? ` (${enzLabel})` : ''} of ${digestDialogBlock.name}`;
              const newId = addBlock(activeConversationId, frag.sequence, fragName);
              setBlockParent(newId, digestDialogBlock.id, 'restriction_digest');
            }
            showNotification(`Digest produced ${fragments.length} fragment${fragments.length !== 1 ? 's' : ''}`);
            setDigestDialogBlock(null);
          }}
          onClose={() => setDigestDialogBlock(null)}
        />
      )}

      {/* Ligation Dialog */}
      {ligationDialogOpen && (
        <LigationDialog
          blocks={blocks}
          onLigate={(result) => {
            if (!activeConversationId) return;
            const newId = addBlock(activeConversationId, result.sequence, result.name);
            if (result.features.length > 0) {
              setBlockFeatures(newId, result.features);
            }
            selectSequenceBlock(newId);
            showNotification(`Ligated to ${result.sequence.length.toLocaleString()} bp construct`);
            setLigationDialogOpen(false);
          }}
          onClose={() => setLigationDialogOpen(false)}
        />
      )}

      {/* Primer Design Dialog */}
      {primerDesignBlock && (
        <PrimerDesignDialog
          sequence={primerDesignBlock.raw}
          sequenceName={primerDesignBlock.name}
          sequenceLength={primerDesignBlock.raw.length}
          selectedRange={useUIStore.getState().selectedRange}
          onAddFeatures={(features: Feature[]) => {
            for (const feat of features) {
              addFeature(primerDesignBlock.id, feat);
            }
            showNotification(`Added ${features.length} primer annotation${features.length !== 1 ? 's' : ''}`);
            setPrimerDesignBlock(null);
          }}
          onClose={() => setPrimerDesignBlock(null)}
        />
      )}

      {/* Sequence Diff View */}
      {diffDialogOpen && (
        <SequenceDiffView
          blocks={blocks}
          activeBlockId={activeBlockId}
          onClose={() => setDiffDialogOpen(false)}
        />
      )}
      </Suspense>
    </div>
  );
}
