import { useState } from 'react';
import MailEditor from '../components/MailEditor';
import RecipientManager from '../components/RecipientManager';
import { sendCampaign } from '../api/campaigns';

interface FormState {
  name: string;
  subject: string;
  htmlBody: string;
  recipients: string[];
}

type SendStatus = 'idle' | 'loading' | 'success' | 'error';

export default function ComposePage() {
  const [form, setForm] = useState<FormState>({
    name: '',
    subject: '',
    htmlBody: '',
    recipients: [],
  });
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');
  const [feedback, setFeedback] = useState('');
  const [campaignId, setCampaignId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.subject.trim()) {
      setFeedback('Veuillez renseigner un objet.');
      setSendStatus('error');
      return;
    }
    if (!form.htmlBody.trim() || form.htmlBody === '<p></p>') {
      setFeedback('Le corps du message est vide.');
      setSendStatus('error');
      return;
    }
    if (form.recipients.length === 0) {
      setFeedback('Ajoutez au moins un destinataire.');
      setSendStatus('error');
      return;
    }

    setSendStatus('loading');
    setFeedback('');

    try {
      const result = await sendCampaign(form);
      setCampaignId(result.campaignId ?? null);
      setSendStatus('success');
      setFeedback(result.message ?? 'Campagne lancée avec succès !');
    } catch (err) {
      setSendStatus('error');
      setFeedback("Erreur lors du lancement de la campagne. Vérifiez la connexion au serveur.");
      console.error(err);
    }
  };

  const resetForm = () => {
    setForm({ name: '', subject: '', htmlBody: '', recipients: [] });
    setSendStatus('idle');
    setFeedback('');
    setCampaignId(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">✉️ Nouvelle Campagne</h1>
        <p className="text-gray-500 text-sm mt-1">
          Composez votre e-mail et définissez les destinataires avant l'envoi.
        </p>
      </div>

      {/* Feedback */}
      {sendStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-medium">🚀 {feedback}</p>
          {campaignId && (
            <p className="text-green-600 text-sm mt-1">ID Campagne : <code className="bg-green-100 px-1 rounded">{campaignId}</code></p>
          )}
          <button onClick={resetForm} className="mt-3 text-sm text-green-600 underline hover:text-green-800">
            Créer une nouvelle campagne
          </button>
        </div>
      )}

      {sendStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">❌ {feedback}</p>
        </div>
      )}

      {sendStatus !== 'success' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom de campagne */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nom de la campagne
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Ex : Prospection Juin 2026"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Objet */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Objet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Ex : Réduisez vos coûts RH de 5x avec Wip Outsourcing"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              required
            />
          </div>

          {/* Éditeur de mail */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Corps du message <span className="text-red-500">*</span>
            </label>
            <MailEditor
              value={form.htmlBody}
              onChange={(html) => setForm((f) => ({ ...f, htmlBody: html }))}
            />
            <p className="text-xs text-gray-400 mt-2">
              💡 Un lien de désabonnement sera automatiquement ajouté en bas de chaque e-mail.
            </p>
          </div>

          {/* Destinataires */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Destinataires <span className="text-red-500">*</span>
            </label>
            <RecipientManager
              recipients={form.recipients}
              onChange={(r) => setForm((f) => ({ ...f, recipients: r }))}
            />
          </div>

          {/* Bouton envoi */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sendStatus === 'loading'}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
            >
              {sendStatus === 'loading' ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Lancement en cours…
                </>
              ) : (
                <>🚀 Lancer la campagne ({form.recipients.length} destinataire{form.recipients.length > 1 ? 's' : ''})</>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
