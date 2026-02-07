import { describe, it, expect } from 'vitest';
import { parseActions, stripActionBlocks } from '../action-parser';

describe('Action Parser', () => {
  it('parses a single create_block action', () => {
    const text = `Here's the reverse complement:
~~~action
{"action":"create_block","name":"RC of eGFP","sequence":"ATCGATCG","type":"dna"}
~~~`;
    const actions = parseActions(text);
    expect(actions).toHaveLength(1);
    expect(actions[0].action).toBe('create_block');
    expect(actions[0].name).toBe('RC of eGFP');
    expect(actions[0].sequence).toBe('ATCGATCG');
  });

  it('parses multiple actions', () => {
    const text = `I'll create two blocks:
~~~action
{"action":"create_block","name":"Block A","sequence":"ATCG","type":"dna"}
~~~
And rename the existing one:
~~~action
{"action":"rename_block","blockName":"Old Name","newName":"New Name"}
~~~`;
    const actions = parseActions(text);
    expect(actions).toHaveLength(2);
    expect(actions[0].action).toBe('create_block');
    expect(actions[1].action).toBe('rename_block');
  });

  it('skips invalid action types', () => {
    const text = `~~~action
{"action":"delete_everything","target":"all"}
~~~`;
    const actions = parseActions(text);
    expect(actions).toHaveLength(0);
  });

  it('skips malformed JSON', () => {
    const text = `~~~action
{not valid json}
~~~`;
    const actions = parseActions(text);
    expect(actions).toHaveLength(0);
  });

  it('skips empty action blocks', () => {
    const text = `~~~action
~~~`;
    const actions = parseActions(text);
    expect(actions).toHaveLength(0);
  });

  it('handles action without newline after opening fence', () => {
    const text = `~~~action {"action":"create_block","name":"Test","sequence":"ATG","type":"dna"}
~~~`;
    const actions = parseActions(text);
    expect(actions).toHaveLength(1);
  });

  it('parses add_features action', () => {
    const text = `~~~action
{"action":"add_features","blockName":"eGFP","features":[{"id":"f1","name":"Start","type":"cds","start":0,"end":3,"strand":1,"color":"#22d3ee","metadata":{}}]}
~~~`;
    const actions = parseActions(text);
    expect(actions).toHaveLength(1);
    expect(actions[0].action).toBe('add_features');
    expect(actions[0].features).toHaveLength(1);
  });

  it('parses modify_sequence action', () => {
    const text = `~~~action
{"action":"modify_sequence","blockName":"eGFP","sequence":"ATGGTG"}
~~~`;
    const actions = parseActions(text);
    expect(actions).toHaveLength(1);
    expect(actions[0].action).toBe('modify_sequence');
    expect(actions[0].blockName).toBe('eGFP');
  });
});

describe('Strip Action Blocks', () => {
  it('removes action blocks from text', () => {
    const text = `Here's the result:
~~~action
{"action":"create_block","name":"Test","sequence":"ATG","type":"dna"}
~~~
Done!`;
    const stripped = stripActionBlocks(text);
    expect(stripped).toBe("Here's the result:\n\nDone!");
  });

  it('removes multiple action blocks', () => {
    const text = `Start
~~~action
{"action":"create_block","name":"A","sequence":"ATG","type":"dna"}
~~~
Middle
~~~action
{"action":"rename_block","blockName":"A","newName":"B"}
~~~
End`;
    const stripped = stripActionBlocks(text);
    expect(stripped).toContain('Start');
    expect(stripped).toContain('Middle');
    expect(stripped).toContain('End');
    expect(stripped).not.toContain('action');
  });

  it('returns original text when no action blocks', () => {
    const text = 'No actions here.';
    expect(stripActionBlocks(text)).toBe(text);
  });
});
