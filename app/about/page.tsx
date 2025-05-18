import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text mb-4">
            About CMIsomer
          </h1>
          <p className="text-lg text-zinc-400 max-w-3xl mx-auto">
            The premier party management system for Carnegie Mellon University
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
          <div className="rounded-lg overflow-hidden border border-zinc-800 shadow-xl">
            <div className="relative w-full h-96">
              <Image
                src="/placeholder.jpg"
                alt="CMU Campus"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6 text-purple-400">Our Mission</h2>
            <p className="mb-4 text-zinc-300">
              CMIsomer was created by the Tartan Cultural League to simplify and enhance the party management
              experience at Carnegie Mellon University. We believe that organizing events should be
              hassle-free, allowing organizers to focus on creating memorable experiences rather than
              dealing with logistical challenges.
            </p>
            <p className="mb-6 text-zinc-300">
              Our platform provides an end-to-end solution for event management, from registration and
              ticketing to guest tracking and analytics, all designed with the unique needs of CMU
              organizations in mind.
            </p>
            <Link href="/create">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                Create Your First Event
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-purple-400">Why Use CMIsomer?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="pt-6">
                <div className="mb-4 w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Organization Quotas</h3>
                <p className="text-zinc-400">
                  Fairly distribute tickets across multiple organizations with customizable quotas to ensure
                  balanced representation at your events.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="pt-6">
                <div className="mb-4 w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Smart Waitlist</h3>
                <p className="text-zinc-400">
                  Automatically manage waitlists and notify guests when spots become available, ensuring maximum
                  attendance and minimizing no-shows.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="pt-6">
                <div className="mb-4 w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">QR Check-in</h3>
                <p className="text-zinc-400">
                  Streamline entry with QR code-based check-in, allowing for quick verification and reduced
                  queues at your events.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-purple-400">Meet the Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 border-2 border-purple-500">
                <div className="relative w-full h-full">
                  <Image
                    src="/placeholder-user.jpg"
                    alt="Team Member"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <h3 className="text-xl font-bold">Christian Ang</h3>
              <p className="text-purple-400">Lead Developer</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 border-2 border-purple-500">
                <div className="relative w-full h-full">
                  <Image
                    src="/placeholder-user.jpg"
                    alt="Team Member"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <h3 className="text-xl font-bold">Ellyse Lai</h3>
              <p className="text-purple-400">UI/UX Designer</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 border-2 border-purple-500">
                <div className="relative w-full h-full">
                  <Image
                    src="/placeholder-user.jpg"
                    alt="Team Member"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <h3 className="text-xl font-bold">Tartan Cultural League</h3>
              <p className="text-purple-400">Project Sponsors</p>
            </div>
          </div>
        </div>

        {/* Contact & FAQ Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-purple-400">Contact Us</h2>
            <p className="mb-6 text-zinc-300">
              Have questions about CMIsomer or need help setting up your event? Get in touch with us!
            </p>
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs">
                      @
                    </div>
                    <span>cmisomer@andrew.cmu.edu</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs">
                      #
                    </div>
                    <span>UC 314 - Tartan Cultural League Office</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs">
                      !
                    </div>
                    <span>Request support: @CMITechTeam on Slack</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6 text-purple-400">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Is CMIsomer free to use?</h3>
                <p className="text-zinc-400">
                  Yes, CMIsomer is completely free for all CMU organizations and student groups.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Can I customize my event page?</h3>
                <p className="text-zinc-400">
                  Currently, we offer basic customization options. More advanced customization features are
                  coming soon!
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Who can see my event data?</h3>
                <p className="text-zinc-400">
                  Only designated event administrators have access to your event data and analytics.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4 text-purple-400">Ready to get started?</h2>
          <p className="mb-8 text-zinc-300 max-w-2xl mx-auto">
            Join the growing community of CMU organizations using CMIsomer to create unforgettable events.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/create">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                Create Your Event
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="border-purple-600 text-purple-400">
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}