import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useClients } from '../../hooks/useClients';

const statusClass = (statut: string) => {
  if (statut === 'actif') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (statut === 'prospect') return 'bg-amber-100 text-amber-700 border-amber-200';
  if (statut === 'inactif') return 'bg-slate-200 text-slate-600 border-slate-300';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

export default function ClientsPage() {
  const navigate = useNavigate();
  const { items, loading, error } = useClients();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) =>
      `${c.code_client} ${c.nom}`.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900">Clients</CardTitle>
            <p className="text-sm text-slate-500">Liste des clients et accès rapide aux fiches.</p>
          </div>
          <Button type="button" onClick={() => navigate('/clients/nouveau')}>
            <Plus className="w-4 h-4" />
            Nouveau client
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Rechercher par nom ou code client"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {loading ? (
            <div className="text-sm text-slate-500">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-slate-500">Aucun client trouvé.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-3 px-3">Code client</th>
                    <th className="py-3 px-3">Nom</th>
                    <th className="py-3 px-3">Ville</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <td className="py-3 px-3 font-medium">{client.code_client}</td>
                      <td className="py-3 px-3">{client.nom}</td>
                      <td className="py-3 px-3">{client.ville || '-'}</td>
                      <td className="py-3 px-3">{client.type_structure || '-'}</td>
                      <td className="py-3 px-3">
                        <Badge className={statusClass(client.statut)}>{client.statut || 'n/a'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
