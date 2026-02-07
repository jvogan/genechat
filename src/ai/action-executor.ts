import type { AIAction, ActionResult } from '../store/types';
import { useSequenceStore } from '../store/sequence-store';
import { useUIStore } from '../store/ui-store';

/**
 * Resolve a block name to a block ID within a conversation.
 * Case-insensitive matching.
 */
function resolveBlockId(blockName: string, conversationId: string): string | null {
  const blocks = useSequenceStore.getState().getConversationBlocks(conversationId);
  const lower = blockName.toLowerCase();
  const match = blocks.find((b) => b.name.toLowerCase() === lower);
  return match?.id ?? null;
}

/**
 * Execute a list of AI actions against the workspace.
 * Each action is executed independently; failures don't stop subsequent actions.
 */
export function executeActions(actions: AIAction[], conversationId: string): ActionResult[] {
  const results: ActionResult[] = [];
  const store = useSequenceStore.getState();

  for (const action of actions) {
    try {
      switch (action.action) {
        case 'create_block': {
          if (!action.sequence) {
            results.push({ success: false, description: 'Create block', error: 'No sequence provided' });
            break;
          }
          const name = action.name || 'AI-generated sequence';
          const blockId = store.addBlock(conversationId, action.sequence, name);
          if (action.features && action.features.length > 0) {
            store.setBlockFeatures(blockId, action.features);
          }
          // Set topology if AI specifies circular
          if (action.topology === 'circular') {
            useSequenceStore.setState((s) => ({
              blocks: s.blocks.map((b) => b.id === blockId ? { ...b, topology: 'circular' as const } : b),
            }));
          }
          const unit = action.type === 'protein' ? 'aa' : 'bp';
          results.push({
            success: true,
            description: `Created block "${name}" (${action.sequence.length} ${unit})`,
          });
          break;
        }

        case 'add_features': {
          if (!action.blockName) {
            results.push({ success: false, description: 'Add features', error: 'No block name specified' });
            break;
          }
          const blockId = resolveBlockId(action.blockName, conversationId);
          if (!blockId) {
            results.push({ success: false, description: 'Add features', error: `Block "${action.blockName}" not found` });
            break;
          }
          if (!action.features || action.features.length === 0) {
            results.push({ success: false, description: 'Add features', error: 'No features provided' });
            break;
          }
          for (const feat of action.features) {
            if (!feat.id) feat.id = crypto.randomUUID();
            store.addFeature(blockId, feat);
          }
          results.push({
            success: true,
            description: `Added ${action.features.length} feature(s) to "${action.blockName}"`,
          });
          break;
        }

        case 'modify_sequence': {
          if (!action.blockName) {
            results.push({ success: false, description: 'Modify sequence', error: 'No block name specified' });
            break;
          }
          const blockId = resolveBlockId(action.blockName, conversationId);
          if (!blockId) {
            results.push({ success: false, description: 'Modify sequence', error: `Block "${action.blockName}" not found` });
            break;
          }
          if (!action.sequence) {
            results.push({ success: false, description: 'Modify sequence', error: 'No sequence provided' });
            break;
          }
          store.updateBlockRaw(blockId, action.sequence, []);
          results.push({
            success: true,
            description: `Modified sequence of "${action.blockName}" (${action.sequence.length} bp)`,
          });
          break;
        }

        case 'rename_block': {
          if (!action.blockName) {
            results.push({ success: false, description: 'Rename block', error: 'No block name specified' });
            break;
          }
          const blockId = resolveBlockId(action.blockName, conversationId);
          if (!blockId) {
            results.push({ success: false, description: 'Rename block', error: `Block "${action.blockName}" not found` });
            break;
          }
          if (!action.newName) {
            results.push({ success: false, description: 'Rename block', error: 'No new name provided' });
            break;
          }
          store.updateBlockName(blockId, action.newName);
          results.push({
            success: true,
            description: `Renamed "${action.blockName}" to "${action.newName}"`,
          });
          break;
        }

        case 'select_region': {
          if (!action.blockName) {
            results.push({ success: false, description: 'Select region', error: 'No block name specified' });
            break;
          }
          const blockId = resolveBlockId(action.blockName, conversationId);
          if (!blockId) {
            results.push({ success: false, description: 'Select region', error: `Block "${action.blockName}" not found` });
            break;
          }
          if (action.start == null || action.end == null) {
            results.push({ success: false, description: 'Select region', error: 'No start/end specified' });
            break;
          }
          const uiStore = useUIStore.getState();
          uiStore.selectSequenceBlock(blockId);
          uiStore.setSelectedRange({ start: action.start, end: action.end });
          results.push({
            success: true,
            description: `Selected region ${action.start + 1}-${action.end} in "${action.blockName}"`,
          });
          break;
        }

        default:
          results.push({ success: false, description: `Unknown action: ${action.action}`, error: 'Unsupported action' });
      }
    } catch (err) {
      results.push({
        success: false,
        description: `Action "${action.action}" failed`,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return results;
}
