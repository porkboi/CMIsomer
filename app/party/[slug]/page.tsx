import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PartyHeader } from "@/components/party-header";
import { RegistrationForm } from "@/components/registration-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/components/dashboard";
import { LoginForm } from "@/components/login-form";
import { isAuthenticated } from "@/lib/auth";
import { getPartyBySlug } from "@/lib/actions";

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

// Types
interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

type Party = Awaited<ReturnType<typeof getPartyBySlug>>;

// Helper Components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-zinc-400">Loading...</div>
  </div>
);

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

interface RegistrationTabProps {
  party: NonNullable<Party>;
  slug: string;
}

const RegistrationTab = ({ party, slug }: RegistrationTabProps) => (
  <TabsContent value={TAB_VALUES.REGISTER} className={STYLES.TABS_CONTENT}>
    <Suspense fallback={<LoadingSpinner />}>
      <RegistrationForm party={party} partySlug={slug} />
    </Suspense>
  </TabsContent>
);

interface DashboardTabProps {
  party: NonNullable<Party>;
  slug: string;
  authenticated: boolean;
}

const DashboardTab = ({ party, slug, authenticated }: DashboardTabProps) => (
  <TabsContent value={TAB_VALUES.DASHBOARD} className={STYLES.TABS_CONTENT}>
    {authenticated ? (
      <Suspense key="dashboard" fallback={<LoadingSpinner />}>
        <Dashboard party={party} partySlug={slug} />
      </Suspense>
    ) : (
      <Suspense key="login" fallback={<LoadingSpinner />}>
        <LoginForm
          partySlug={slug}
          adminUsername={party.admin_username}
        />
      </Suspense>
    )}
  </TabsContent>
);

export default async function PartyPage(props: PageProps) {
  // Extract params and fetch data
  const params = await props.params;
  const [authenticated, party] = await Promise.all([
    isAuthenticated(params.slug),
    getPartyBySlug(params.slug),
  ]);

  // Handle party not found
  if (!party) {
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
