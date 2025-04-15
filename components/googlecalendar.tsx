import { getPartyBySlug } from "@/lib/actions";

const SCOPES = "https://www.googleapis.com/auth/calendar.events";

export async function sendGoogleCalendarInvite(partySlug: string, email: string): Promise<void> {
  if (!email) {
    throw new Error("Email is required");
  }

  await loadGapi();

  const authInstance = gapi.auth2.getAuthInstance();
  if (!authInstance.isSignedIn.get()) {
    await authInstance.signIn();
  }

  const party = await getPartyBySlug(partySlug);

  const event: gapi.client.calendar.Event = {
    summary: party.name,
    description: party.name,
    start: {
      dateTime: `${party.event_date}T${party.event_time}:00`,
      timeZone: "EST",
    },
    attendees: [{ email }],
    reminders: {
      useDefault: true,
    },
  };

  await gapi.client.calendar.events.insert({
    calendarId: "primary",
    resource: event,
    sendUpdates: "all",
  });
}

async function loadGapi(): Promise<void> {
  return new Promise((resolve, reject) => {
    const initClient = () => {
      gapi.client
        .init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
          ],
          scope: SCOPES,
        })
        .then(resolve)
        .catch(reject);
    };

    const loadClient = () => {
      gapi.load("client:auth2", initClient);
    };

    if (typeof gapi === "undefined") {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = loadClient;
      script.onerror = reject;
      document.body.appendChild(script);
    } else {
      loadClient();
    }
  });
}