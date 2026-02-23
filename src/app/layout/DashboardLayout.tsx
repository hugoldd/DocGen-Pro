import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  FileText,
  Tag,
  Layers,
  Settings,
  PlayCircle,
  History,
  CalendarDays,
  Menu,
  Bell,
  ChevronRight,
  Search,
  User,
  Users
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApp } from '../context/AppContext';
import { useCompetences } from '../hooks/useCompetences';
import { usePrestations } from '../hooks/usePrestations';
import { usePacks } from '../hooks/usePacks';

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-20 shadow-xl">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">D</div>
          <span className="text-white font-semibold text-lg tracking-tight">DocGen Pro</span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              isActive
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                : "hover:bg-slate-800 hover:text-white"
            )
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium text-sm">Tableau de bord</span>
        </NavLink>

        <div className="pt-4">
          <div className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Paramétrage DocGen
          </div>
          <div className="mt-2 space-y-1">
            <NavLink
              to="/templates"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                    : "hover:bg-slate-800 hover:text-white"
                )
              }
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium text-sm">Bibliothèque de templates</span>
            </NavLink>
            <NavLink
              to="/configuration"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                    : "hover:bg-slate-800 hover:text-white"
                )
              }
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium text-sm">Configuration projets</span>
            </NavLink>
            <NavLink
              to="/variables"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                    : "hover:bg-slate-800 hover:text-white"
                )
              }
            >
              <Menu className="w-5 h-5" />
              <span className="font-medium text-sm">Dictionnaire de variables</span>
            </NavLink>
          </div>
        </div>

        <div className="pt-4">
          <div className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Paramétrage Ressources
          </div>
          <div className="mt-2 space-y-1">
            <NavLink
              to="/parametrage/competences"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                    : "hover:bg-slate-800 hover:text-white"
                )
              }
            >
              <Tag className="w-5 h-5" />
              <span className="font-medium text-sm">Compétences</span>
            </NavLink>
            <NavLink
              to="/parametrage/prestations"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                    : "hover:bg-slate-800 hover:text-white"
                )
              }
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium text-sm">Prestations</span>
            </NavLink>
            <NavLink
              to="/parametrage/packs"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                    : "hover:bg-slate-800 hover:text-white"
                )
              }
            >
              <Layers className="w-5 h-5" />
              <span className="font-medium text-sm">Packs</span>
            </NavLink>
            <NavLink
              to="/parametrage/consultants"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                    : "hover:bg-slate-800 hover:text-white"
                )
              }
            >
              <User className="w-5 h-5" />
              <span className="font-medium text-sm">Consultants</span>
            </NavLink>
            <NavLink
              to="/parametrage/equipes"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                    : "hover:bg-slate-800 hover:text-white"
                )
              }
            >
              <Users className="w-5 h-5" />
              <span className="font-medium text-sm">Équipes</span>
            </NavLink>
          </div>
        </div>

        <div className="pt-4">
          <div className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Opérationnel
          </div>
          <div className="mt-2 space-y-1">
          <NavLink
            to="/clients"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                  : "hover:bg-slate-800 hover:text-white"
              )
            }
          >
            <Users className="w-5 h-5" />
            <span className="font-medium text-sm">Clients</span>
          </NavLink>
          <NavLink
            to="/workflow"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                  : "hover:bg-slate-800 hover:text-white"
              )
            }
          >
            <PlayCircle className="w-5 h-5" />
            <span className="font-medium text-sm">Prise en charge client</span>
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                  : "hover:bg-slate-800 hover:text-white"
              )
            }
          >
            <History className="w-5 h-5" />
            <span className="font-medium text-sm">Historique</span>
          </NavLink>
          <NavLink
            to="/planning/docgen"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                  : "hover:bg-slate-800 hover:text-white"
              )
            }
          >
            <CalendarDays className="w-5 h-5" />
            <span className="font-medium text-sm">Planning envois</span>
          </NavLink>
          <NavLink
            to="/planning/projets"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                  : "hover:bg-slate-800 hover:text-white"
              )
            }
          >
            <CalendarDays className="w-5 h-5" />
            <span className="font-medium text-sm">Planning projets</span>
          </NavLink>
          </div>
        </div>
      </nav>

    </aside>
  );
}

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { records, templates, projectTypes } = useApp();
  const { items: competences } = useCompetences();
  const { items: prestations } = usePrestations();
  const { items: packs } = usePacks();
  const userInitials = 'TD';
  const userName = 'Thomas Dubois';
  const userRole = 'Admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return "Vue d'ensemble";
    if (path.startsWith('/templates')) return 'Templates';
    if (path.startsWith('/configuration')) return 'Configuration';
    if (path.startsWith('/workflow')) return 'Prise en charge';
    if (path.startsWith('/history')) return 'Historique';
    if (path.startsWith('/planning')) return 'Planning';
    return 'Page';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!notifRef.current) return;
      if (!notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem('docgen_notif_read');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setReadIds(parsed.filter((id) => typeof id === 'string'));
      }
    } catch (error) {
      setReadIds([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('docgen_notif_read', JSON.stringify(readIds));
  }, [readIds]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const canSearch = normalizedQuery.length >= 2;

  type Notif = {
    id: string;
    type: 'email-imminent' | 'email-week' | 'doc-imminent' | 'question-imminent' | 'generation-error';
    label: string;
    description: string;
    route: string;
  };

  const notifications = useMemo<Notif[]>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const soon = new Date(now);
    soon.setDate(now.getDate() + 2);
    const week = new Date(now);
    week.setDate(now.getDate() + 7);

    const items: Notif[] = [];

    records.forEach((record) => {
      record.scheduledEmails?.forEach((email) => {
        const emailDate = new Date(email.date);
        emailDate.setHours(0, 0, 0, 0);
        if (Number.isNaN(emailDate.getTime())) return;
        const isSent = record.sentEmailIds?.includes(email.id) || false;
        if (isSent) return;
        if (emailDate >= now && emailDate <= soon) {
          items.push({
            id: `email-imminent-${record.id}-${email.id}`,
            type: 'email-imminent',
            label: 'Email imminent',
            description: `${email.label} — ${record.clientName}`,
            route: '/planning/docgen',
          });
        } else if (emailDate > soon && emailDate <= week) {
          items.push({
            id: `email-week-${record.id}-${email.id}`,
            type: 'email-week',
            label: 'Email cette semaine',
            description: `${email.label} — ${record.clientName}`,
            route: '/planning/docgen',
          });
        }
      });

      record.scheduledDocuments?.forEach((doc) => {
        const docDate = new Date(doc.date);
        docDate.setHours(0, 0, 0, 0);
        if (Number.isNaN(docDate.getTime())) return;
        if (docDate >= now && docDate <= week) {
          items.push({
            id: `doc-${record.id}-${doc.id}`,
            type: 'doc-imminent',
            label: 'Document à générer',
            description: `${doc.label} — ${record.clientName}`,
            route: '/planning/docgen',
          });
        }
      });

      record.scheduledQuestions?.forEach((q) => {
        const qDate = new Date(q.date);
        qDate.setHours(0, 0, 0, 0);
        if (Number.isNaN(qDate.getTime())) return;
        if (qDate >= now && qDate <= week) {
          items.push({
            id: `question-${record.id}-${q.id}`,
            type: 'question-imminent',
            label: 'Question à traiter',
            description: `${q.label} — ${record.clientName}`,
            route: '/planning',
          });
        }
      });

      if (record.status === 'error') {
        const recordDate = new Date(record.date);
        if (!Number.isNaN(recordDate.getTime())) {
          const daysDiff = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysDiff >= 0 && daysDiff <= 7) {
            items.push({
              id: `generation-error-${record.id}`,
              type: 'generation-error',
              label: 'Génération en erreur',
              description: record.clientName,
              route: '/history',
            });
          }
        }
      }
    });

    return items;
  }, [records]);

  const unreadCount = notifications.filter((notif) => !readIds.includes(notif.id)).length;

  const historyResults = useMemo(() => {
    if (!canSearch) return [];
    return records
      .filter(
        (record) =>
          (record.clientName || '').toLowerCase().includes(normalizedQuery) ||
          (record.clientNumber || '').toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 3);
  }, [records, normalizedQuery, canSearch]);

  const templateResults = useMemo(() => {
    if (!canSearch) return [];
    return templates
      .filter(
        (template) =>
          (template.name || '').toLowerCase().includes(normalizedQuery) ||
          (template.type || '').toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 3);
  }, [templates, normalizedQuery, canSearch]);

  const projectTypeResults = useMemo(() => {
    if (!canSearch) return [];
    return projectTypes
      .filter(
        (projectType) =>
          (projectType.name || '').toLowerCase().includes(normalizedQuery) ||
          (projectType.code || '').toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 3);
  }, [projectTypes, normalizedQuery, canSearch]);

  const planningResults = useMemo(() => {
    if (!canSearch) return [];
    const results: Array<{ label: string; clientName: string }> = [];
    records.forEach((record) => {
      record.scheduledEmails?.forEach((email) => {
        const label = email.label || '';
        const clientName = record.clientName || '';
        if (
          label.toLowerCase().includes(normalizedQuery) ||
          clientName.toLowerCase().includes(normalizedQuery)
        ) {
          results.push({ label, clientName });
        }
      });
    });
    return results.slice(0, 3);
  }, [records, normalizedQuery, canSearch]);

  const competencesResults = useMemo(() => {
    if (!canSearch) return [];
    return competences
      .filter(
        (item) =>
          (item.label || '').toLowerCase().includes(normalizedQuery) ||
          (item.categorie || '').toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 3);
  }, [competences, normalizedQuery, canSearch]);

  const prestationsResults = useMemo(() => {
    if (!canSearch) return [];
    return prestations
      .filter(
        (item) =>
          (item.label || '').toLowerCase().includes(normalizedQuery) ||
          (item.type || '').toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 3);
  }, [prestations, normalizedQuery, canSearch]);

  const packsResults = useMemo(() => {
    if (!canSearch) return [];
    return packs
      .filter(
        (item) =>
          (item.label || '').toLowerCase().includes(normalizedQuery) ||
          (item.description || '').toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 3);
  }, [packs, normalizedQuery, canSearch]);

  const contactResults = useMemo(() => {
    if (!canSearch) return [];
    const seen = new Set<string>();
    const results: { label: string; sub: string; recordId: string }[] = [];
    records.forEach((record) => {
      (record.contacts || []).forEach((contact) => {
        const searchableContact = [contact.name, contact.email, contact.role]
          .join(' ')
          .toLowerCase();
        if (!searchableContact.includes(normalizedQuery)) return;
        const key = contact.email || contact.name;
        if (seen.has(key)) return;
        seen.add(key);
        results.push({
          label: contact.name || contact.email || '',
          sub: contact.email || contact.role || '',
          recordId: record.id,
        });
      });
    });
    return results.slice(0, 3);
  }, [canSearch, records, normalizedQuery]);

  const hasResults =
    historyResults.length +
      templateResults.length +
      projectTypeResults.length +
      planningResults.length +
      competencesResults.length +
      prestationsResults.length +
      packsResults.length +
      contactResults.length >
    0;

  const handleResultClick = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setShowResults(false);
  };

  const handleContactClick = (recordId: string) => {
    navigate('/history', { state: { openRecordId: recordId } });
    setSearchQuery('');
    setShowResults(false);
  };

  const handleNotifClick = (notif: Notif) => {
    navigate(notif.route);
    setNotifOpen(false);
  };

  const handleMarkAllRead = () => {
    const allIds = notifications.map((notif) => notif.id);
    setReadIds((prev) => Array.from(new Set([...prev, ...allIds])));
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 ml-64 px-10">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <NavLink to="/" className="text-slate-400 hover:text-slate-600">
          Accueil
        </NavLink>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <span className="font-medium text-slate-900">{getBreadcrumb()}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block" ref={searchRef}>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 w-64 text-slate-700 placeholder:text-slate-400"
            value={searchQuery}
            onChange={(event) => {
              const nextValue = event.target.value;
              setSearchQuery(nextValue);
              setShowResults(nextValue.trim().length >= 2);
            }}
          />
          {showResults && canSearch && (
            <div className="absolute left-0 top-full mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {!hasResults && (
                  <div className="px-4 py-3 text-sm text-slate-500">
                    Aucun résultat pour {searchQuery}
                  </div>
                )}
                {historyResults.length > 0 && (
                  <div className="border-b border-slate-100">
                    <div className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Historique
                    </div>
                    {historyResults.map((record, idx) => (
                      <button
                        key={`${record.clientNumber}-${idx}`}
                        onClick={() => handleResultClick('/history')}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                      >
                        <div className="font-medium text-slate-900">{record.clientName}</div>
                        <div className="text-xs text-slate-500">{record.clientNumber}</div>
                      </button>
                    ))}
                  </div>
                )}
                {templateResults.length > 0 && (
                  <div className="border-b border-slate-100">
                    <div className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Templates
                    </div>
                    {templateResults.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleResultClick('/templates')}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                      >
                        <div className="font-medium text-slate-900">{template.name}</div>
                        <div className="text-xs text-slate-500">{template.type}</div>
                      </button>
                    ))}
                  </div>
                )}
                {projectTypeResults.length > 0 && (
                  <div className="border-b border-slate-100">
                    <div className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Types de projets
                    </div>
                    {projectTypeResults.map((projectType) => (
                      <button
                        key={projectType.id}
                        onClick={() => handleResultClick('/configuration')}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                      >
                        <div className="font-medium text-slate-900">{projectType.name}</div>
                        <div className="text-xs text-slate-500">{projectType.code}</div>
                      </button>
                    ))}
                  </div>
                )}
                {planningResults.length > 0 && (
                  <div>
                    <div className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Planning
                    </div>
                    {planningResults.map((email, idx) => (
                      <button
                        key={`${email.label}-${idx}`}
                        onClick={() => handleResultClick('/planning/docgen')}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                      >
                        <div className="font-medium text-slate-900">{email.label}</div>
                        <div className="text-xs text-slate-500">{email.clientName}</div>
                      </button>
                    ))}
                  </div>
                )}
                {competencesResults.length > 0 && (
                  <div className="border-t border-slate-100">
                    <div className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-slate-400" />
                      Compétences
                    </div>
                    {competencesResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick('/parametrage/competences')}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                      >
                        <div className="font-medium text-slate-900">{item.label}</div>
                        <div className="text-xs text-slate-500">{item.categorie}</div>
                      </button>
                    ))}
                  </div>
                )}
                {prestationsResults.length > 0 && (
                  <div className="border-t border-slate-100">
                    <div className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      Prestations
                    </div>
                    {prestationsResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick('/parametrage/prestations')}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                      >
                        <div className="font-medium text-slate-900">{item.label}</div>
                        <div className="text-xs text-slate-500">{item.type || '-'}</div>
                      </button>
                    ))}
                  </div>
                )}
                {packsResults.length > 0 && (
                  <div className="border-t border-slate-100">
                    <div className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-400" />
                      Packs
                    </div>
                    {packsResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick('/parametrage/packs')}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                      >
                        <div className="font-medium text-slate-900">{item.label}</div>
                        <div className="text-xs text-slate-500">{item.description || '-'}</div>
                      </button>
                    ))}
                  </div>
                )}
                {contactResults.length > 0 && (
                  <div>
                    <div className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      Interlocuteurs
                    </div>
                    {contactResults.map((contact, idx) => (
                      <button
                        key={`${contact.recordId}-${idx}`}
                        onClick={() => handleContactClick(contact.recordId)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                      >
                        <div className="font-medium text-slate-900">{contact.label}</div>
                        <div className="text-xs text-slate-500">{contact.sub}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((prev) => !prev)}
            className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-50"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white rounded-full text-[10px] font-semibold flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-10 w-80 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-900">Notifications</span>
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Tout lire
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="px-4 py-6 text-sm text-slate-500">Aucune notification</div>
                )}
                {notifications.map((notif) => {
                  const isRead = readIds.includes(notif.id);
                  return (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors ${
                        isRead ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="text-sm font-medium text-slate-900">{notif.label}</div>
                      <div className="text-xs text-slate-500 mt-1">{notif.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 mx-1"></div>

        <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
            {userInitials}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-slate-700 leading-none">{userName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <Header />
      <main className="ml-64 px-10 py-10 min-h-[calc(100vh-64px)]">
        <Outlet />
      </main>
    </div>
  );
}



