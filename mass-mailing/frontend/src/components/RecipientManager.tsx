import { useCallback, useState } from 'react';

interface RecipientManagerProps {
  recipients: string[];
  onChange: (recipients: string[]) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RecipientManager({ recipients, onChange }: RecipientManagerProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const parseAndAdd = useCallback(
    (raw: string) => {
      const parsed = raw
        .split(/[\n,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0);

      const valid = parsed.filter((e) => EMAIL_REGEX.test(e));
      const invalid = parsed.filter((e) => !EMAIL_REGEX.test(e));

      const merged = [...new Set([...recipients, ...valid])];
      onChange(merged);
      setInputValue('');

      if (invalid.length > 0) {
        setError(`${invalid.length} adresse(s) ignorée(s) car invalide(s) : ${invalid.slice(0, 3).join(', ')}${invalid.length > 3 ? '…' : ''}`);
      } else {
        setError('');
      }
    },
    [recipients, onChange]
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Accepte CSV ou fichier texte brut
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseAndAdd(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const removeRecipient = (email: string) => {
    onChange(recipients.filter((r) => r !== email));
  };

  const clearAll = () => {
    onChange([]);
    setError('');
  };

  return (
    <div className="space-y-3">
      {/* Zone de saisie */}
      <div className="flex gap-2">
        <textarea
          rows={3}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          placeholder="Collez vos adresses e-mail ici, séparées par des virgules, des points-virgules ou des sauts de ligne..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData('text');
            parseAndAdd(pasted);
          }}
        />
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => parseAndAdd(inputValue)}
            className="px-3 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
          >
            Ajouter
          </button>
          <label className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-center">
            📎 CSV
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Erreurs de validation */}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
          ⚠️ {error}
        </p>
      )}

      {/* Compteur + actions */}
      {recipients.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            <strong className="text-orange-600">{recipients.length}</strong> destinataire(s) ajouté(s)
          </span>
          <button
            type="button"
            onClick={clearAll}
            className="text-red-500 hover:text-red-700 text-xs underline"
          >
            Tout supprimer
          </button>
        </div>
      )}

      {/* Liste des destinataires */}
      {recipients.length > 0 && (
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white">
          {recipients.map((email) => (
            <div
              key={email}
              className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 text-sm"
            >
              <span className="text-gray-700 truncate">{email}</span>
              <button
                type="button"
                onClick={() => removeRecipient(email)}
                className="text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
