import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";

// Marketing
import HomePage from "@/pages/home";
import RefundPolicyPage from "@/pages/refund-policy";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsPage from "@/pages/terms";
import PhysicianPage from "@/pages/physician/index";
import PhysicianSignupPage from "@/pages/physician/signup";
import PhysicianSignin from "@/pages/physician/signin";
import AboutPage from "@/pages/about";
import BlogsPage from "@/pages/blogs";
import ProgramsPage from "@/pages/programs";
import FaqsPage from "@/pages/faqs";
import ConnectPage from "@/pages/connect";

// Auth
import PatientSignin from "@/pages/patient/signin";
import PatientSignup from "@/pages/patient/signup";
import CoachSignin from "@/pages/coach/signin";
import OpsSignin from "@/pages/ops/signin";

// Patient Portal
import PatientDashboard from "@/pages/patient/dashboard";
import PatientCheckin from "@/pages/patient/checkin";
import PatientAppointments from "@/pages/patient/appointments";
import PatientRecords from "@/pages/patient/records";
import PatientSupport from "@/pages/patient/support";
import PatientSettings from "@/pages/patient/settings";

// Coach Portal (legacy)
import CoachPatients from "@/pages/coach/patients/index";
import CoachPatientDetail from "@/pages/coach/patients/detail";

// Physician Portal
import PhysicianDashboard from "@/pages/physician/dashboard";

// Dietician Portal
import DieticianDashboard from "@/pages/dietician/dashboard";

// Caretaker Portal
import CaretakerDashboard from "@/pages/caretaker/dashboard";

// Ops Portal
import OpsDashboard from "@/pages/ops/dashboard";
import OpsAnalytics from "@/pages/ops/analytics";
import OpsSettings from "@/pages/ops/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function Router() {
  return (
    <Switch>
      {/* Public / Marketing */}
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/blogs" component={BlogsPage} />
      <Route path="/programs" component={ProgramsPage} />
      <Route path="/faqs" component={FaqsPage} />
      <Route path="/connect" component={ConnectPage} />
      <Route path="/refund-policy" component={RefundPolicyPage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/physician" component={PhysicianPage} />
      <Route path="/physician/signup" component={PhysicianSignupPage} />

      {/* Patient Portal */}
      <Route path="/patient/signin" component={PatientSignin} />
      <Route path="/patient/signup" component={PatientSignup} />
      <Route path="/patient/dashboard" component={PatientDashboard} />
      <Route path="/patient/checkin" component={PatientCheckin} />
      <Route path="/patient/appointments" component={PatientAppointments} />
      <Route path="/patient/records" component={PatientRecords} />
      <Route path="/patient/support" component={PatientSupport} />
      <Route path="/patient/settings" component={PatientSettings} />

      {/* Staff Signin (shared for physician / dietician / caretaker) */}
      <Route path="/physician/signin" component={PhysicianSignin} />
      <Route path="/staff/signin" component={PhysicianSignin} />
      <Route path="/dietician/signin" component={PhysicianSignin} />
      <Route path="/caretaker/signin" component={PhysicianSignin} />

      {/* Physician Portal */}
      <Route path="/physician/dashboard" component={PhysicianDashboard} />

      {/* Dietician Portal */}
      <Route path="/dietician/dashboard" component={DieticianDashboard} />

      {/* Caretaker Portal */}
      <Route path="/caretaker/dashboard" component={CaretakerDashboard} />

      {/* Legacy Coach Portal */}
      <Route path="/coach/signin" component={CoachSignin} />
      <Route path="/coach/patients" component={CoachPatients} />
      <Route path="/coach/patients/:id" component={CoachPatientDetail} />

      {/* Operations Portal */}
      <Route path="/ops/signin" component={OpsSignin} />
      <Route path="/ops/dashboard" component={OpsDashboard} />
      <Route path="/ops/analytics" component={OpsAnalytics} />
      <Route path="/ops/settings" component={OpsSettings} />

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
