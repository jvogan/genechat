import { useAIStore } from '../../store/ai-store';
import { AI_MODELS, type AIProviderName } from '../../store/types';

interface ModelPickerProps {
  onClose: () => void;
}

const PROVIDER_LABELS: Record<AIProviderName, string> = {
  claude: 'Anthropic',
  openai: 'OpenAI',
  gemini: 'Google',
  kimi: 'Moonshot',
};

const PROVIDER_ORDER: AIProviderName[] = ['claude', 'openai', 'gemini', 'kimi'];

export function ModelPicker({ onClose }: ModelPickerProps) {
  const activeModel = useAIStore((s) => s.activeModel);
  const apiKeys = useAIStore((s) => s.apiKeys);
  const setActiveModel = useAIStore((s) => s.setActiveModel);

  const grouped = PROVIDER_ORDER.map((provider) => ({
    provider,
    label: PROVIDER_LABELS[provider],
    hasKey: !!apiKeys[provider],
    models: AI_MODELS.filter((m) => m.provider === provider),
  }));

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 14,
        marginBottom: 4,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 8,
        width: 260,
        boxShadow: 'var(--shadow-lg)',
        zIndex: 60,
      }}
    >
      {/* Backdrop click to close */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
        }}
      />

      {grouped.map((group) => (
        <div key={group.provider} style={{ marginBottom: 6 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: 'var(--text-muted)',
            }}
          >
            {group.label}
            {!group.hasKey && (
              <span
                style={{
                  fontSize: 9,
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: 'rgba(248,113,113,0.15)',
                  color: '#f87171',
                }}
              >
                No key
              </span>
            )}
            {group.hasKey && (
              <span
                style={{
                  fontSize: 9,
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                }}
              >
                Ready
              </span>
            )}
          </div>
          {group.models.map((model) => (
            <button
              key={model.modelId}
              onClick={() => {
                setActiveModel(model.provider, model.modelId);
                onClose();
              }}
              disabled={!group.hasKey}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '7px 10px',
                borderRadius: 8,
                border: 'none',
                background:
                  activeModel === model.modelId
                    ? 'var(--bg-active)'
                    : 'transparent',
                color: group.hasKey
                  ? 'var(--text-primary)'
                  : 'var(--text-muted)',
                fontSize: 12,
                cursor: group.hasKey ? 'pointer' : 'default',
                fontFamily: 'var(--font-sans)',
                opacity: group.hasKey ? 1 : 0.5,
              }}
            >
              {model.displayName}
              {activeModel === model.modelId && (
                <span style={{ float: 'right', color: 'var(--accent)' }}>
                  &#10003;
                </span>
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
