import { useEffect, useState } from 'react';
import { fetchMailSettings, updateMailSettings } from '../api/settings';
import type { MailSettings } from '../types';

const defaultSettings: MailSettings = {
  smtpHost: 'smtp.ionos.fr',
  smtpPort: 465,
  smtpSecure: true,
  smtpUser: '',
  smtpPass: '',
  fromName: '',
  fromEmail: '',
};

export default function SettingsPage() {
  const [form, setForm] = useState<MailSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const settings = await fetchMailSettings();
        setForm({
          smtpHost: settings.smtpHost,
          smtpPort: settings.smtpPort,
          smtpSecure: settings.smtpSecure,
          smtpUser: settings.smtpUser,
          smtpPass: settings.smtpPass,
          fromName: settings.fromName,
          fromEmail: settings.fromEmail,
        });
      } catch {
        setMessage({ type: 'error', text: 'Impossible de charger les paramètres mail.' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updated = await updateMailSettings(form);
      setForm(updated);
      setMessage({ type: 'success', text: 'Paramètres SMTP mis à jour avec succès.' });
    } catch (err: unknown) {
      const apiMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erreur lors de la sauvegarde des paramètres.';
      setMessage({ type: 'error', text: apiMessage });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Chargement des paramètres...</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Paramètres Mail</h1>
        <p className="text-sm text-gray-500 mt-1">
          Modifiez ici les identifiants SMTP et l'adresse d'expédition, sans toucher au fichier .env.
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg border text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
            <input
              type="text"
              required
              value={form.smtpHost}
              onChange={(e) => setForm((prev) => ({ ...prev, smtpHost: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
            <input
              type="number"
              min={1}
              max={65535}
              required
              value={form.smtpPort}
              onChange={(e) => setForm((prev) => ({ ...prev, smtpPort: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="smtpSecure"
            type="checkbox"
            checked={form.smtpSecure}
            onChange={(e) => setForm((prev) => ({ ...prev, smtpSecure: e.target.checked }))}
            className="h-4 w-4"
          />
          <label htmlFor="smtpSecure" className="text-sm text-gray-700">
            Utiliser une connexion sécurisée (TLS/SSL)
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP User (email)</label>
            <input
              type="email"
              required
              value={form.smtpUser}
              onChange={(e) => setForm((prev) => ({ ...prev, smtpUser: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
            <input
              type="password"
              required
              value={form.smtpPass}
              onChange={(e) => setForm((prev) => ({ ...prev, smtpPass: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom expéditeur</label>
            <input
              type="text"
              required
              value={form.fromName}
              onChange={(e) => setForm((prev) => ({ ...prev, fromName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email expéditeur</label>
            <input
              type="email"
              required
              value={form.fromEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, fromEmail: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
