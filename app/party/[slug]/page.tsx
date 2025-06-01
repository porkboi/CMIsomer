import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PartyHeader } from "@/components/party-header";
import { RegistrationForm } from "@/components/registration-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/components/dashboard";
import { LoginForm } from "@/components/login-form";
import { isAuthenticated } from "@/lib/auth";
import { getPartyBySlug } from "@/lib/actions";
import { Party } from "@/lib/types";

// Constants
const TAB_VALUES = {
  REGISTER: "register",
  DASHBOARD: "dashboard",
} as const;

const STYLES = {
  CONTAINER: "min-h-screen bg-zinc-900 text-white",
  INNER_CONTAINER: "container bg-zinc-800 mx-auto px-4 py-8",
  TABS: "mt-8",
  TABS_LIST: "grid w-full grid-cols-2 bg-zinc-900",
  TABS_TRIGGER: "text-white",
  TABS_CONTENT: "bg-zinc-800 mt-6",
} as const;

const LOADING_MESSAGES = {
  DEFAULT: "Loading...",
  DASHBOARD: "Loading dashboard...",
  LOGIN: "Loading login form...",
  REGISTRATION: "Loading registration form...",
} as const;

// Types
interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface BaseTabProps {
  party: Party;
  slug: string;
}

interface DashboardTabProps extends BaseTabProps {
  authenticated: boolean;
}

// Utility Functions
const createLoadingSpinner = (message: string = LOADING_MESSAGES.DEFAULT) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-zinc-400">{message}</div>
  </div>
);

// Helper Components
/**
 * Navigation component for switching between Register and Dashboard tabs
 */
const TabNavigation = () => (
  <TabsList className={STYLES.TABS_LIST}>
    <TabsTrigger value={TAB_VALUES.REGISTER} className={STYLES.TABS_TRIGGER}>
      Register
    </TabsTrigger>
    <TabsTrigger value={TAB_VALUES.DASHBOARD} className={STYLES.TABS_TRIGGER}>
      Dashboard
    </TabsTrigger>
  </TabsList>
);

/**
 * Registration tab content with form for new attendees
 */
const RegistrationTab = ({ party, slug }: BaseTabProps) => (
  <TabsContent value={TAB_VALUES.REGISTER} className={STYLES.TABS_CONTENT}>
    <Suspense fallback={createLoadingSpinner(LOADING_MESSAGES.REGISTRATION)}>
      <RegistrationForm party={party} partySlug={slug} />
    </Suspense>
  </TabsContent>
);

/**
 * Dashboard tab content - shows admin dashboard when authenticated, login form when not
 */
const DashboardTab = ({ party, slug, authenticated }: DashboardTabProps) => (
  <TabsContent value={TAB_VALUES.DASHBOARD} className={STYLES.TABS_CONTENT}>
    {authenticated ? (
      <Suspense key="dashboard" fallback={createLoadingSpinner(LOADING_MESSAGES.DASHBOARD)}>
        <Dashboard party={party} partySlug={slug} />
      </Suspense>
    ) : (
      <Suspense key="login" fallback={createLoadingSpinner(LOADING_MESSAGES.LOGIN)}>
        <LoginForm
          partySlug={slug}
          adminUsername={party.admin_username}
        />
      </Suspense>
    )}
  </TabsContent>
);

// Data fetching utility
async function fetchPartyData(slug: string): Promise<{
  authenticated: boolean;
  party: Party | null;
  error: unknown;
}> {
  try {
    const [authenticated, party] = await Promise.all([
      isAuthenticated(slug),
      getPartyBySlug(slug),
    ]);

    return { authenticated, party, error: null };
  } catch (error) {
    console.error('Error fetching party data:', error);
    return { authenticated: false, party: null, error };
  }
}

// Main page component
export default async function PartyPage(props: PageProps) {
  // Extract params and fetch data
  const params = await props.params;
  const { authenticated, party, error } = await fetchPartyData(params.slug);

  // Handle party not found or errors
  if (error || !party) {
    notFound();
  }

  return (
    <div className={STYLES.CONTAINER}>
      <div className={STYLES.INNER_CONTAINER}>
        <PartyHeader
          title={party.name}
          organizations={party.organizations}
          eventDate={party.event_date}
          eventTime={party.event_time}
          location={party.location}
        />

        <Tabs defaultValue={TAB_VALUES.REGISTER} className={STYLES.TABS}>
          <TabNavigation />
          <RegistrationTab party={party} slug={params.slug} />
          <DashboardTab
            party={party}
            slug={params.slug}
            authenticated={authenticated}
          />
        </Tabs>
      </div>
    </div>
  );
}
