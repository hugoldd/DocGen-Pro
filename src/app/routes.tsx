import { createBrowserRouter } from "react-router";
import DashboardLayout from "./layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import TemplateList from "./pages/templates/TemplateList";
import TemplateEditor from "./pages/templates/TemplateEditor";
import ProjectConfig from "./pages/config/ProjectConfig";
import ProjectWizard from "./pages/config/ProjectWizard";
import VariablesPage from "./pages/config/VariablesPage";
import WorkflowEngine from "./pages/workflow/WorkflowEngine";
import HistoryPage from "./pages/history/History";
import PlanningDocGenPage from "./pages/planning/PlanningDocGenPage";
import PlanningProjetsPage from "./pages/planning/PlanningProjetsPage";
import CompetencesPage from "./pages/parametrage/competences/CompetencesPage";
import PrestationsPage from "./pages/parametrage/prestations/PrestationsPage";
import PacksPage from "./pages/parametrage/packs/PacksPage";
import ConsultantsPage from "./pages/parametrage/consultants/ConsultantsPage";
import EquipesPage from "./pages/parametrage/equipes/EquipesPage";
import ClientsPage from "./pages/clients/ClientsPage";
import NouveauClientPage from "./pages/clients/NouveauClientPage";
import ClientDetailPage from "./pages/clients/ClientDetailPage";
import ProjetDetailPage from "./pages/projets/ProjetDetailPage";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      Component: DashboardLayout,
      children: [
        { index: true, Component: Dashboard },
        { path: "templates", Component: TemplateList },
        { path: "templates/new", Component: TemplateEditor },
        { path: "templates/:id", Component: TemplateEditor },
        {
          path: "configuration",
          children: [
            { index: true, Component: ProjectConfig },
            { path: "nouveau", Component: ProjectWizard },
            { path: ":id/modifier", Component: ProjectWizard },
          ],
        },
        { path: "variables", Component: VariablesPage },
        { path: "parametrage/competences", Component: CompetencesPage },
        { path: "parametrage/prestations", Component: PrestationsPage },
        { path: "parametrage/packs", Component: PacksPage },
        { path: "parametrage/consultants", Component: ConsultantsPage },
        { path: "parametrage/equipes", Component: EquipesPage },
        { path: "clients", Component: ClientsPage },
        { path: "clients/nouveau", Component: NouveauClientPage },
        { path: "clients/:id", Component: ClientDetailPage },
        { path: "projets/:id", Component: ProjetDetailPage },
        { path: "workflow", Component: WorkflowEngine },
        { path: "history", Component: HistoryPage },
        {
          path: "planning",
          children: [
            { index: true, Component: PlanningDocGenPage },
            { path: "docgen", Component: PlanningDocGenPage },
            { path: "projets", Component: PlanningProjetsPage },
          ],
        },
        { path: "*", Component: () => <div className="p-8 text-center text-slate-500">Page non trouvée</div> },
      ],
    },
  ],
  { basename: "/DocGen-Pro/" }
);
