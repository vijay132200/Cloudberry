import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";

// Marketing
import HomePage from "@/pages/home";
import ProgramsPage from "@/pages/programs";
import AboutPage from "@/pages/about";
import BlogsPage from "@/pages/blogs";
import FaqsPage from "@/pages/faqs";
import PhysicianPage from "@/pages/physician/index";
import PhysicianSignupPage from "@/pages/physician/signup";

// Auth
import PatientSignin from "@/pages/patient/signin";
import PatientSignup from "@/pages/patient/signup";
import CoachSignin from "@/pages/coach/signin";
import OpsSignin from "@/pages/ops/signin";

// App routes
import PatientDashboard from "@/pages/patient/dashboard";
import PatientRecords from "@/pages/patient/records";
import PatientSupport from "@/pages/patient/support";
import PatientSettings from "@/pages/patient/settings";

import CoachPatients from "@/pages/coach/patients/index";
import CoachPatientDetail from "@/pages/coach/patients/detail";

import OpsDashboard from "@/pages/ops/dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Public / Marketing */}
      <Route path="/" component={HomePage} />
      <Route path="/programs" component={ProgramsPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/blogs" component={BlogsPage} />
      <Route path="/faqs" component={FaqsPage} />
      <Route path="/physician" component={PhysicianPage} />
      <Route path="/physician/signup" component={PhysicianSignupPage} />

      {/* Patient */}
      <Route path="/patient/signin" component={PatientSignin} />
      <Route path="/patient/signup" component={PatientSignup} />
      <Route path="/patient/dashboard" component={PatientDashboard} />
      <Route path="/patient/records" component={PatientRecords} />
      <Route path="/patient/support" component={PatientSupport} />
      <Route path="/patient/settings" component={PatientSettings} />

      {/* Coach */}
      <Route path="/coach/signin" component={CoachSignin} />
      <Route path="/coach/patients" component={CoachPatients} />
      <Route path="/coach/patients/:id" component={CoachPatientDetail} />

      {/* Ops */}
      <Route path="/ops/signin" component={OpsSignin} />
      <Route path="/ops/dashboard" component={OpsDashboard} />

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
