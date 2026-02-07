import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { useAIStore } from '../../store/ai-store';
import { providerRegistry } from '../../ai/provider-registry';
import type { AIProviderName } from '../../store/types';

interface APIKeySettingsProps {
  onClose: () => void;
}

const PROVIDERS: { name: AIProviderName; label: string; placeholder: string }[] = [
  { name: 'claude', label: 'Anthropic (Claude)', placeholder: 'sk-ant-...' },
  { name: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
  { name: 'gemini', label: 'Google (Gemini)', placeholder: 'AIza...' },
  { name: 'kimi', label: 'Moonshot (Kimi)', placeholder: 'sk-...' },
];

export function APIKeySettings({ onClose }: APIKeySettingsProps) {
  const apiKeys = useAIStore((s) => s.apiKeys);
  const setApiKey = useAIStore((s) => s.setApiKey);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, 'idle' | 'testing' | 'ok' | 'fail'>>({});

  const toggleVisible = useCallback((name: string) => {
    setVisible((v) => ({ ...v, [name]: !v[name] }));
  }, []);

  const testKey = useCallback(async (name: AIProviderName) => {
    const provider = providerRegistry.get(name);
    if (!provider) return;

    setTesting((t) => ({ ...t, [name]: 'testing' }));
    try {
      const ok = await provider.validateKey({
        apiKey: apiKeys[name],
        model: '',
      });
      setTesting((t) => ({ ...t, [name]: ok ? 'ok' : 'fail' }));
    } catch {
      setTesting((t) => ({ ...t, [name]: 'fail' }));
    }
  }, [apiKeys]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 24,
          width: 440,
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>API Key Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            title="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Enter your API keys to enable AI chat. Keys are stored locally in your browser.
        </p>

        {PROVIDERS.map(({ name, label, placeholder }) => {
          const status = testing[name] || 'idle';
          return (
            <div key={name} style={{ marginBottom: 16 }}>
              <label
                htmlFor={`api-key-${name}`}
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                {label}
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    id={`api-key-${name}`}
                    type={visible[name] ? 'text' : 'password'}
                    value={apiKeys[name]}
                    onChange={(e) => setApiKey(name, e.target.value)}
                    placeholder={placeholder}
                    style={{
                      width: '100%',
                      padding: '8px 36px 8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => toggleVisible(name)}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: 12,
                      padding: 0,
                    }}
                  >
                    {visible[name] ? 'Hide' : 'Show'}
                  </button>
                </div>
                <button
                  onClick={() => testKey(name)}
                  disabled={!apiKeys[name] || status === 'testing'}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background:
                      status === 'ok'
                        ? 'rgba(74,222,128,0.15)'
                        : status === 'fail'
                          ? 'rgba(248,113,113,0.15)'
                          : 'var(--bg-tertiary)',
                    color:
                      status === 'ok'
                        ? '#4ade80'
                        : status === 'fail'
                          ? '#f87171'
                          : 'var(--text-secondary)',
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: apiKeys[name] && status !== 'testing' ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                    opacity: apiKeys[name] ? 1 : 0.4,
                  }}
                >
                  {status === 'testing'
                    ? 'Testing...'
                    : status === 'ok'
                      ? 'Connected'
                      : status === 'fail'
                        ? 'Failed'
                        : 'Test'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
