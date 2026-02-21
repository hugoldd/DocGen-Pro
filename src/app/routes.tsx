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
import PlanningPage from "./pages/planning/PlanningPage";

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
        { path: "workflow", Component: WorkflowEngine },
        { path: "history", Component: HistoryPage },
        { path: "planning", Component: PlanningPage },
        { path: "*", Component: () => <div className="p-8 text-center text-slate-500">Page non trouvée</div> },
      ],
    },
  ],
  { basename: "/DocGen-Pro/" }
);
