import { useEffect, useState, useCallback } from 'react';
import {
  fetchContacts,
  fetchTags,
  createContact,
  deleteContact,
  deleteContacts,
  importContacts,
} from '../api/contacts';
import type { Contact, CreateContactPayload } from '../types';

const LIMIT = 50;

export default function ContactsPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterUnsub, setFilterUnsub] = useState<boolean | undefined>(undefined);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // New contact form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateContactPayload>({ email: '', firstName: '', lastName: '', tags: [] });
  const [formTagInput, setFormTagInput] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Import
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Feedback
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Load contacts ──────────────────────────────────────────────────────────
  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await fetchContacts({
          search: search || undefined,
          tag: filterTag || undefined,
          unsubscribed: filterUnsub,
          page,
          limit: LIMIT,
        });
        setContacts(res.data);
        setPagination(res.pagination);
        setSelected(new Set());
      } catch {
        setActionMsg({ type: 'error', text: 'Erreur lors du chargement des contacts.' });
      } finally {
        setLoading(false);
      }
    },
    [search, filterTag, filterUnsub]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  useEffect(() => {
    fetchTags().then(setTags).catch(() => {});
  }, []);

  // ── Selection helpers ──────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === contacts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(contacts.map((c) => c._id)));
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDeleteOne = async (id: string) => {
    if (!confirm('Supprimer ce contact ?')) return;
    try {
      await deleteContact(id);
      setActionMsg({ type: 'success', text: 'Contact supprimé.' });
      load(pagination.page);
    } catch {
      setActionMsg({ type: 'error', text: 'Erreur lors de la suppression.' });
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Supprimer ${selected.size} contact(s) ?`)) return;
    try {
      await deleteContacts([...selected]);
      setActionMsg({ type: 'success', text: `${selected.size} contact(s) supprimé(s).` });
      load(pagination.page);
    } catch {
      setActionMsg({ type: 'error', text: 'Erreur lors de la suppression groupée.' });
    }
  };

  // ── Import CSV ─────────────────────────────────────────────────────────────
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImportResult(null);
    setImportError(null);
    try {
      const result = await importContacts(file);
      setImportResult(
        `✅ ${result.imported} importé(s), ${result.skipped} ignoré(s), ${result.invalid} invalide(s) sur ${result.total} lignes.`
      );
      fetchTags().then(setTags).catch(() => {});
      load(1);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erreur lors de l\'import.';
      setImportError(msg);
    }
  };

  // ── Create contact ─────────────────────────────────────────────────────────
  const handleAddTag = () => {
    const tag = formTagInput.trim();
    if (tag && !(formData.tags ?? []).includes(tag)) {
      setFormData((f) => ({ ...f, tags: [...(f.tags ?? []), tag] }));
    }
    setFormTagInput('');
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await createContact(formData);
      setFormData({ email: '', firstName: '', lastName: '', tags: [] });
      setFormTagInput('');
      setShowForm(false);
      setActionMsg({ type: 'success', text: 'Contact créé avec succès.' });
      fetchTags().then(setTags).catch(() => {});
      load(1);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erreur lors de la création.';
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">👥 Contacts</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gérez vos listes de contacts et importez des fichiers CSV.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Import CSV */}
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors cursor-pointer font-medium">
            📎 Importer CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          {/* New contact */}
          <button
            onClick={() => { setShowForm(true); setFormError(''); }}
            className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            + Nouveau contact
          </button>
        </div>
      </div>

      {/* Import feedback */}
      {importResult && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {importResult}
        </div>
      )}
      {importError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          ❌ {importError}
        </div>
      )}

      {/* Action feedback */}
      {actionMsg && (
        <div
          className={`p-3 rounded-lg text-sm border ${
            actionMsg.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}
        >
          {actionMsg.text}
          <button
            onClick={() => setActionMsg(null)}
            className="ml-3 text-gray-400 hover:text-gray-600 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* New contact form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Nouveau contact</h2>
            <form onSubmit={handleSubmitForm} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={formData.email}
                  onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                  placeholder="exemple@domaine.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={formData.firstName}
                    onChange={(e) => setFormData((f) => ({ ...f, firstName: e.target.value }))}
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={formData.lastName}
                    onChange={(e) => setFormData((f) => ({ ...f, lastName: e.target.value }))}
                    placeholder="Dupont"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Ajouter un tag…"
                    value={formTagInput}
                    onChange={(e) => setFormTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                  >
                    Ajouter
                  </button>
                </div>
                {(formData.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(formData.tags ?? []).map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setFormData((f) => ({ ...f, tags: f.tags?.filter((t) => t !== tag) }))}
                          className="hover:text-red-500"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {formError && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
                  ❌ {formError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-sm bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-60"
                >
                  {formLoading ? 'Création…' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="🔍 Rechercher (email, nom…)"
            className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="">Tous les tags</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={filterUnsub === undefined ? '' : String(filterUnsub)}
            onChange={(e) => {
              const v = e.target.value;
              setFilterUnsub(v === '' ? undefined : v === 'true');
            }}
          >
            <option value="">Tous</option>
            <option value="false">Actifs</option>
            <option value="true">Désabonnés</option>
          </select>
          {(search || filterTag || filterUnsub !== undefined) && (
            <button
              onClick={() => { setSearch(''); setFilterTag(''); setFilterUnsub(undefined); }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm">
          <span className="text-orange-700 font-medium">{selected.size} sélectionné(s)</span>
          <button
            onClick={handleDeleteSelected}
            className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition-colors"
          >
            🗑️ Supprimer la sélection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Chargement…</div>
        ) : contacts.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <p className="text-3xl mb-2">👤</p>
            <p>Aucun contact trouvé.</p>
            <p className="text-xs mt-1 text-gray-300">
              Importez un fichier CSV ou créez un contact manuellement.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left w-8">
                    <input
                      type="checkbox"
                      checked={selected.size === contacts.length && contacts.length > 0}
                      onChange={toggleSelectAll}
                      className="accent-orange-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">E-mail</th>
                  <th className="px-4 py-3 text-left">Prénom</th>
                  <th className="px-4 py-3 text-left">Nom</th>
                  <th className="px-4 py-3 text-left">Tags</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                  <th className="px-4 py-3 text-left">Ajouté le</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contacts.map((contact) => (
                  <tr
                    key={contact._id}
                    className={`hover:bg-orange-50 transition-colors ${
                      selected.has(contact._id) ? 'bg-orange-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(contact._id)}
                        onChange={() => toggleSelect(contact._id)}
                        className="accent-orange-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{contact.email}</td>
                    <td className="px-4 py-3 text-gray-600">{contact.firstName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{contact.lastName || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.length > 0 ? (
                          contact.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {contact.isUnsubscribed ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                          Désabonné
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full font-medium">
                          Actif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(contact.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteOne(contact._id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>
              {pagination.total} contact(s) — page {pagination.page}/{pagination.pages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => load(pagination.page - 1)}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                ← Précédent
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => load(pagination.page + 1)}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* Total count (no pagination) */}
        {pagination.pages <= 1 && contacts.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
            {pagination.total} contact(s) au total
          </div>
        )}
      </div>
    </div>
  );
}
