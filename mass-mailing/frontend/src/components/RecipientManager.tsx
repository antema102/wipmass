import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchContacts } from '../api/contacts';
import type { Contact } from '../types';

interface RecipientManagerProps {
  recipients: string[];
  onChange: (recipients: string[]) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Modale de sélection depuis les contacts ─────────────────────────────────

function ContactPickerModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (emails: string[]) => void;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (searchVal: string, p: number) => {
    setLoading(true);
    try {
      const res = await fetchContacts({
        search: searchVal || undefined,
        unsubscribed: false,
        page: p,
        limit: 50,
      });
      setContacts(res.data);
      setTotalPages(res.pagination.pages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(search, page);
  }, [page]);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => load(val, 1), 300);
  };

  const toggleOne = (email: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  const toggleAll = () => {
    const visibleEmails = contacts
      .filter((c) => !c.isUnsubscribed)
      .map((c) => c.email);
    const allSelected = visibleEmails.every((e) => selected.has(e));
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        visibleEmails.forEach((e) => next.delete(e));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        visibleEmails.forEach((e) => next.add(e));
        return next;
      });
    }
  };

  const handleConfirm = () => {
    onImport([...selected]);
    onClose();
  };

  const visibleEmails = contacts.filter((c) => !c.isUnsubscribed).map((c) => c.email);
  const allVisible = visibleEmails.length > 0 && visibleEmails.every((e) => selected.has(e));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col" style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">👥 Importer depuis les contacts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100">
          <input
            type="text"
            autoFocus
            placeholder="Rechercher par nom ou email…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Contact list */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Chargement…</div>
          ) : contacts.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">Aucun contact trouvé.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left w-8">
                    <input type="checkbox" checked={allVisible} onChange={toggleAll} className="w-4 h-4" />
                  </th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 font-medium">Nom</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 font-medium">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contacts.map((c) => (
                  <tr
                    key={c._id}
                    className={`hover:bg-orange-50 cursor-pointer ${c.isUnsubscribed ? 'opacity-40' : ''}`}
                    onClick={() => !c.isUnsubscribed && toggleOne(c.email)}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(c.email)}
                        disabled={c.isUnsubscribed}
                        onChange={() => toggleOne(c.email)}
                        className="w-4 h-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {c.firstName || c.lastName
                        ? `${c.firstName} ${c.lastName}`.trim()
                        : <span className="text-gray-400 italic">—</span>}
                      {c.isUnsubscribed && (
                        <span className="ml-2 text-xs text-red-400">désabonné</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-500">{c.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 px-5 py-2 border-t border-gray-100 text-sm text-gray-500">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">‹ Préc.</button>
            <span>{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40">Suiv. ›</button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <span className="text-xs text-gray-500">
            {selected.size} contact(s) sélectionné(s)
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">
              Annuler
            </button>
            <button
              disabled={selected.size === 0}
              onClick={handleConfirm}
              className="px-4 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              Ajouter {selected.size > 0 ? `(${selected.size})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RecipientManager ─────────────────────────────────────────────────────────

export default function RecipientManager({ recipients, onChange }: RecipientManagerProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [showPicker, setShowPicker] = useState(false);

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

  const handleImportFromContacts = (emails: string[]) => {
    const merged = [...new Set([...recipients, ...emails])];
    onChange(merged);
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
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
            title="Importer depuis mes contacts"
          >
            👥 Contacts
          </button>
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

      {/* Modale de sélection depuis les contacts */}
      {showPicker && (
        <ContactPickerModal
          onClose={() => setShowPicker(false)}
          onImport={handleImportFromContacts}
        />
      )}
    </div>
  );
}
