import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { fetchCampaigns, fetchCampaignLogs, duplicateCampaign, deleteCampaign } from '../api/campaigns';
import type { Campaign, EmailLog } from '../types';

const STATUS_LABELS: Record<string, string> = {
  draft: '📝 Brouillon',
  scheduled: '📅 Planifiée',
  sending: '⏳ En cours',
  completed: '✅ Terminée',
  cancelled: '🚫 Annulée',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-violet-100 text-violet-700',
  sending: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCampaigns();
        setCampaigns(data);
      } catch (err) {
        console.error('Erreur chargement campagnes :', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelectCampaign = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setLogsLoading(true);
    try {
      const data = await fetchCampaignLogs(campaign._id);
      setLogs(data);
    } catch (err) {
      console.error('Erreur chargement logs :', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleDuplicateCampaign = async (campaign: Campaign) => {
    try {
      const newCampaign = await duplicateCampaign(campaign._id);
      // Recharger la liste des campagnes
      const data = await fetchCampaigns();
      setCampaigns(data);
      alert(`✅ Campagne dupliquée : "${newCampaign.name}"`);
    } catch (err) {
      console.error('Erreur duplication campagne :', err);
      alert('❌ Erreur lors de la duplication.');
    }
  };

  const handleOpenCampaignInComposer = (campaign: Campaign) => {
    navigate(`/?campaignId=${campaign._id}`);
  };

  const handleDeleteCampaign = async (campaign: Campaign) => {
    if (!window.confirm(`Supprimer la campagne "${campaign.name}" et tous ses logs ? Cette action est irréversible.`)) return;
    try {
      await deleteCampaign(campaign._id);
      setCampaigns((prev) => prev.filter((c) => c._id !== campaign._id));
      if (selectedCampaign?._id === campaign._id) {
        setSelectedCampaign(null);
        setLogs([]);
      }
    } catch (err) {
      console.error('Erreur suppression campagne :', err);
      alert('❌ Erreur lors de la suppression.');
    }
  };

  // Données pour le graphique global
  const chartData = campaigns.map((c) => ({
    name: c.name.length > 15 ? c.name.slice(0, 15) + '…' : c.name,
    Envoyés: c.totalSent,
    Échoués: c.totalFailed,
    Désabonnés: c.totalUnsubscribed,
  }));

  // Statistiques globales
  const totalSent = campaigns.reduce((s, c) => s + c.totalSent, 0);
  const totalFailed = campaigns.reduce((s, c) => s + c.totalFailed, 0);
  const totalUnsub = campaigns.reduce((s, c) => s + c.totalUnsubscribed, 0);
  void totalUnsub; // affiché dans le graphique via chartData
  const successRate =
    totalSent + totalFailed > 0
      ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(1)
      : '—';

  // Statistiques de tracking (ouvertures et clics)
  const totalOpened = logs.filter((log) => log.openedAt).length;
  const totalClicked = logs.filter((log) => log.clickedAt).length;
  const openRate =
    totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '—';
  const clickRate =
    totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '—';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📊 Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Suivez les performances de vos campagnes d'e-mailing.
        </p>
      </div>

      {/* ── KPIs globaux ── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Campagnes', value: campaigns.length, color: 'text-gray-800', bg: 'bg-white' },
          { label: 'E-mails envoyés', value: totalSent, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Échecs', value: totalFailed, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Taux de succès', value: `${successRate}%`, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Ouvertures', value: totalOpened, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Clics', value: totalClicked, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-5 shadow-sm border border-gray-200`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            {label === 'Ouvertures' && totalSent > 0 && (
              <p className="text-xs text-gray-500 mt-1">Taux: {openRate}%</p>
            )}
            {label === 'Clics' && totalSent > 0 && (
              <p className="text-xs text-gray-500 mt-1">Taux: {clickRate}%</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Graphique ── */}
      {campaigns.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Performances par campagne</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Envoyés" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Échoués" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Désabonnés" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Liste des campagnes ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-700">Historique des campagnes</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Chargement…</div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p>Aucune campagne pour le moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left">Campagne</th>
                  <th className="px-6 py-3 text-left">Statut</th>
                  <th className="px-6 py-3 text-center">Destinataires</th>
                  <th className="px-6 py-3 text-center">Envoyés</th>
                  <th className="px-6 py-3 text-center">Échecs</th>
                  <th className="px-6 py-3 text-center">Désabonnés</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map((c) => (
                  <tr
                    key={c._id}
                    className={`hover:bg-orange-50 transition-colors ${
                      selectedCampaign?._id === c._id ? 'bg-orange-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-800">{c.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">{c.recipients.length}</td>
                    <td className="px-6 py-4 text-center text-green-600 font-semibold">{c.totalSent}</td>
                    <td className="px-6 py-4 text-center text-red-500 font-semibold">{c.totalFailed}</td>
                    <td className="px-6 py-4 text-center text-orange-500 font-semibold">{c.totalUnsubscribed}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleSelectCampaign(c)}
                          className="text-xs text-orange-500 hover:text-orange-700 underline"
                          title="Afficher les logs"
                        >
                          📋 Logs
                        </button>
                        <button
                          onClick={() => handleDuplicateCampaign(c)}
                          className="text-xs text-blue-500 hover:text-blue-700 underline"
                          title="Dupliquer cette campagne"
                        >
                          📋 Dupliquer
                        </button>
                        <button
                          onClick={() => handleOpenCampaignInComposer(c)}
                          className="text-xs text-violet-600 hover:text-violet-800 underline"
                          title="Ouvrir dans Composer"
                        >
                          ✏️ Ouvrir
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(c)}
                          className="text-xs text-red-500 hover:text-red-700 underline"
                          title="Supprimer cette campagne et ses logs"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Logs détaillés ── */}
      {selectedCampaign && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">
              Logs — <span className="text-orange-500">{selectedCampaign.name}</span>
            </h2>
            <button
              onClick={() => setSelectedCampaign(null)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕ Fermer
            </button>
          </div>

          {logsLoading ? (
            <div className="p-6 text-center text-gray-400">Chargement des logs…</div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left">Destinataire</th>
                    <th className="px-6 py-3 text-center">Statut d'envoi</th>
                    <th className="px-6 py-3 text-center">Interactions</th>
                    <th className="px-6 py-3 text-left">Erreur</th>
                    <th className="px-6 py-3 text-left">Date d'envoi</th>
                    <th className="px-6 py-3 text-left">Ouvert le</th>
                    <th className="px-6 py-3 text-left">Cliqué le</th>
                    <th className="px-6 py-3 text-left">Désabonné le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-700">{log.recipient}</td>
                      <td className="px-6 py-3 text-center">
                        {log.status === 'sent' && <span className="text-green-600 font-medium">✅ Envoyé</span>}
                        {log.status === 'opened' && <span className="text-blue-600 font-medium">👁️ Ouvert</span>}
                        {log.status === 'clicked' && <span className="text-emerald-600 font-medium">🔗 Cliqué</span>}
                        {log.status === 'failed' && <span className="text-red-500 font-medium">❌ Échoué</span>}
                        {log.status === 'pending' && <span className="text-blue-500 font-medium">⏳ En attente</span>}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs">
                          {log.openedAt && <span className="text-blue-600 font-medium">👁️</span>}
                          {log.clickedAt && <span className="text-green-600 font-medium">🔗</span>}
                          {!log.openedAt && !log.clickedAt && <span className="text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-red-400 text-xs">{log.errorMessage ?? '—'}</td>
                      <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(log.sentAt).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-3 text-blue-500 text-xs whitespace-nowrap">
                        {log.openedAt
                          ? new Date(log.openedAt).toLocaleDateString('fr-FR', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="px-6 py-3 text-green-600 text-xs whitespace-nowrap">
                        {log.clickedAt
                          ? new Date(log.clickedAt).toLocaleDateString('fr-FR', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="px-6 py-3 text-orange-500 text-xs whitespace-nowrap">
                        {log.unsubscribedAt
                          ? new Date(log.unsubscribedAt).toLocaleDateString('fr-FR', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
