"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Music, PartyPopper, Send, Ticket } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { submitRegistration, getPriceTiers, redeemPromoCode, submitDatingEntry } from "@/lib/actions";
import { Party } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface RegistrationFormProps {
  party: Party;
  partySlug: string;
}

export function RegistrationForm({ party, partySlug }: RegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [currentTierCap, setCurrentTierCap] = useState(0);
  const [priceTiers, setPriceTiers] = useState<any[]>([]);
  const [currentTierIndex, setCurrentTierIndex] = useState(0);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const datingPoolEnabled = party.enable_dating_pool ?? false;
  const datingPoolLocked = party.dating_pool_locked ?? false;
  const seekingOptions = ["Women", "Men", "Non-binary", "Open to anyone"];

  const currentTierPrice = useMemo(() => {
    const base =
      priceTiers.length > 0
        ? priceTiers[currentTierIndex]?.price || 0
        : party.ticket_price;
    return appliedPromoCode ? 0 : base;
  }, [priceTiers, currentTierIndex, party.ticket_price, appliedPromoCode]);

  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, {
          message: "Name must be at least 2 characters.",
        }),
        age: z
          .string()
          .refine(
            (val) => !isNaN(Number.parseInt(val)) && Number.parseInt(val) >= 18,
            {
              message: "You must be at least 18 years old.",
            }
          ),
        andrewID: z
          .string()
          .min(2, { message: "Andrew ID must be at least 2 characters." })
          .refine((val) => !val.includes(" "), {
            message: "Andrew ID cannot contain spaces.",
          }),
        paymentMethod:
          currentTierPrice > 0
            ? z.enum(["venmo", "zelle"], {
                required_error: "Please select a payment method.",
              })
            : z.string().optional(),
        paymentConfirmed:
          currentTierPrice > 0
            ? z.enum(["yes", "no"], {
                required_error: "Please confirm if you've paid.",
              })
            : z.string().optional(),
        organization: z.enum(party.organizations as [string, ...string[]], {
          required_error: "Please select your organization.",
        }),
        promoCode: z.string().optional(),
        joinDatingPool: z.boolean().default(false),
        genderIdentity: z.string().optional(),
        pronouns: z.string().optional(),
        seeking: z.array(z.string()).default([]),
        connectionGoal: z.string().optional(),
        vibe: z.string().optional(),
        allowPublicIntro: z.boolean().optional(),
      }).superRefine((values, ctx) => {
        if (values.joinDatingPool) {
          if (!values.genderIdentity || values.genderIdentity.trim().length === 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["genderIdentity"],
              message: "Tell us how you identify.",
            });
          }
          if (!values.seeking || values.seeking.length === 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["seeking"],
              message: "Pick who you want to be matched with.",
            });
          }
        }
      }),
    [currentTierPrice, party.organizations]
  );
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: "",
      andrewID: "",
      promoCode: "",
      joinDatingPool: false,
      genderIdentity: "",
      pronouns: "",
      seeking: [],
      connectionGoal: "",
      vibe: "",
      allowPublicIntro: false,
    },
  });

  // Update form resolver when schema changes
  useEffect(() => {
    form.clearErrors();
  }, [formSchema, form]);

  useEffect(() => {
    // Fetch registration count
    const fetchRegistrationCount = async () => {
      try {
        const response = await fetch(
          `/api/registrations/count?partySlug=${partySlug}`
        );
        if (response.ok) {
          const data = await response.json();
          setRegistrationCount(data.count);
        }
      } catch (error) {
        console.error("Error fetching registration count:", error);
      }
    };

    // Fetch price tiers
    const fetchPriceTiers = async () => {
      try {
        const tiers = await getPriceTiers(partySlug);
        setPriceTiers(tiers);

        // Determine current tier based on registration count
        let cumulativeCapacity = 0;
        let currentIndex = 0;

        for (let i = 0; i < tiers.length; i++) {
          cumulativeCapacity += tiers[i].capacity;
          if (registrationCount < cumulativeCapacity) {
            currentIndex = i;
            break;
          }
        }

        setCurrentTierCap(cumulativeCapacity);
        setCurrentTierIndex(currentIndex);
      } catch (error) {
        console.error("Error fetching price tiers:", error);
      }
    };

    fetchRegistrationCount();
    fetchPriceTiers();
  }, [partySlug, registrationCount]);

  // Payment component functions
  const renderPaymentMethodSelector = () => (
    <FormField
      control={form.control}
      name="paymentMethod"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel>Payment Method</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex flex-col space-y-1"
            >
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl>
                  <RadioGroupItem value="venmo" />
                </FormControl>
                <FormLabel className="font-normal">Venmo</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl>
                  <RadioGroupItem value="zelle" />
                </FormControl>
                <FormLabel className="font-normal">Zelle</FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>{" "}
          <FormDescription>
            Please send the above quoted amount using one of these methods, and
            include your andrewID in the description:
            <br />
            <span className="font-medium">Venmo:</span> {party.venmo_username}
            <br />
            <span className="font-medium">Zelle:</span> {party.zelle_info}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
  const renderVenmoPaymentButton = () => {
    // Mobile devices: Use venmo:// deep link to open Venmo app directly
    // Desktop/Web: Use https://venmo.com web URL in new tab since app isn't available
    const venmoPaymentLink = isMobile
      ? `venmo://paycharge?txn=pay&recipients=${party.venmo_username}&amount=${currentTierPrice}&note=Party%20Registration%20${form.watch("andrewID")}`
      : `https://venmo.com/u/${party.venmo_username}`;

    return (
      <Button
        asChild
        className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
      >
        <a
          href={venmoPaymentLink}
          target={isMobile ? "_self" : "_blank"}
          rel={isMobile ? "" : "noopener noreferrer"}
        >
          <Send className="mr-2 h-4 w-4" />
          Pay with Venmo - ${currentTierPrice}
        </a>
      </Button>
    );
  };

  const renderPaymentConfirmation = () => (
    <FormField
      control={form.control}
      name="paymentConfirmed"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel>Have you Venmo/Zelle'd?</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex space-x-4"
            >
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <RadioGroupItem value="yes" />
                </FormControl>
                <FormLabel className="font-normal">Yes</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <RadioGroupItem value="no" />
                </FormControl>
                <FormLabel className="font-normal">No</FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      // Prepare submission data based on whether payment is required
      const submissionData = {
        ...values,
        paymentMethod:
          currentTierPrice > 0
            ? (values.paymentMethod as "venmo" | "zelle")
            : "venmo",
        paymentConfirmed:
          currentTierPrice > 0
            ? (values.paymentConfirmed as "yes" | "no")
            : "yes",
        // include the final price and applied promo for server-side record
        price: currentTierPrice,
        appliedPromoCode: appliedPromoCode ?? null,
      };

      const result = await submitRegistration(partySlug, submissionData);

      if (result.success) {
        if (values.joinDatingPool && datingPoolEnabled && !datingPoolLocked) {
          const datingResult = await submitDatingEntry(partySlug, {
            andrewID: values.andrewID,
            name: values.name,
            age: Number.parseInt(values.age, 10),
            genderIdentity: values.genderIdentity?.trim() || "unspecified",
            pronouns: values.pronouns?.trim() || undefined,
            seeking: values.seeking || [],
            connectionGoal: values.connectionGoal?.trim() || undefined,
            vibe: values.vibe?.trim() || undefined,
            allowPublicIntro: values.allowPublicIntro ?? false,
          });

          if (!datingResult.success) {
            toast({
              title: "Dating pool error",
              description: datingResult.message,
              variant: "destructive",
            });
          }
        }

        toast({
          title: "Registration submitted!",
          description:
            "We are confirming your attendance. Please check your CMU email inbox for more details.",
          variant: "default",
        });
        form.reset();
      } else {
        toast({
          title: "Registration failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Ticket helper functions
  const getTicketTierStatus = (tierIndex: number) => {
    const isCurrent = tierIndex === currentTierIndex;
    const isPast = tierIndex < currentTierIndex;
    const isFuture = tierIndex > currentTierIndex;

    return { isCurrent, isPast, isFuture };
  };

  const getAvailabilityStatus = (isCurrent: boolean, isPast: boolean) => {
    const spotsRemaining = currentTierCap - registrationCount;
    const isSoldOut = spotsRemaining <= 0;

    if (isPast)
      return { status: "Closed", className: "bg-zinc-800 text-zinc-400" };
    if (!isCurrent)
      return { status: "Coming Soon", className: "bg-zinc-800 text-zinc-400" };

    if (isSoldOut)
      return { status: "Sold Out", className: "bg-red-900/50 text-red-300" };
    if (spotsRemaining < 20)
      return {
        status: "Limited",
        className: "bg-yellow-900/50 text-yellow-300",
      };

    return { status: "Available", className: "bg-green-900/50 text-green-300" };
  };

  const formatPrice = (price: number) => {
    return price === 0 ? "Free" : `$${price}`;
  };

  const getTierDescription = (isCurrent: boolean, isPast: boolean) => {
    if (isPast) return "No longer available";
    if (isCurrent) return "Spots available";
    return "Available after current tier sells out";
  };

  const renderTierCard = (tier: any, index: number) => {
    const { isCurrent, isPast } = getTicketTierStatus(index);
    const { status, className } = getAvailabilityStatus(isCurrent, isPast);

    return (
      <Card
        key={tier.id}
        className={`bg-zinc-950 border-zinc-800 transition-all ${
          isCurrent ? "ring-2 ring-primary scale-105 z-10" : ""
        } ${isPast ? "opacity-60" : ""}`}
      >
        <CardHeader className={`${isCurrent ? "bg-primary/10" : ""}`}>
          <CardTitle className="text-white flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            {tier.name}
            {isCurrent && (
              <span className="ml-auto text-xs bg-primary text-white px-2 py-1 rounded-full">
                Current
              </span>
            )}
            {isPast && (
              <span className="ml-auto text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full">
                Sold Out
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {getTierDescription(isCurrent, isPast)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-bold text-white">
                {formatPrice(tier.price)}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${className}`}>
              {status}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  const renderFallbackTicketCard = () => {
    const spotsRemaining = party.max_capacity - registrationCount;
    const isSoldOut = spotsRemaining <= 0;

    const getStatusConfig = () => {
      if (isSoldOut)
        return { status: "Sold Out", className: "bg-red-900/50 text-red-300" };
      if (spotsRemaining < 20)
        return {
          status: "Limited Availability",
          className: "bg-yellow-900/50 text-yellow-300",
        };
      return {
        status: "Available",
        className: "bg-green-900/50 text-green-300",
      };
    };

    const { status, className } = getStatusConfig();

    return (
      <Card className="bg-zinc-950 border-zinc-800 md:col-span-3">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Ticket Information
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {isSoldOut
              ? "Sold out - join the waitlist"
              : `${spotsRemaining} spots remaining`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            {" "}
            <div>
              <p className="text-2xl font-bold text-white">
                {formatPrice(party.ticket_price)}
              </p>
              <p className="text-xs text-zinc-400">Standard admission</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${className}`}>
              {status}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="bg-zinc-800 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {priceTiers.length > 0
          ? priceTiers.map((tier, index) => renderTierCard(tier, index))
          : renderFallbackTicketCard()}
      </div>

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 shadow-lg">
        <div className="mb-6 flex items-center gap-2">
          <PartyPopper className="h-5 w-5 text-pink-500" />
          <h2 className="text-xl font-semibold">Party Registration</h2>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            // Disable form fields if waitlist is not allowed
            style={party.allow_waitlist ? {} : { pointerEvents: "none", opacity: 0.6 }}
          >
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        className="bg-zinc-900 border-zinc-800"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="18"
                        {...field}
                        className="bg-zinc-900 border-zinc-800"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="andrewID"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Andrew ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="jdoe"
                      {...field}
                      className="bg-zinc-900 border-zinc-800"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="promoCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Promo Code (Optional)</FormLabel>
                  <div className="flex gap-2 items-center">
                    <FormControl className="flex-1">
                      <Input
                        placeholder="Enter promo code"
                        {...field}
                        className="bg-zinc-900 border-zinc-800"
                        disabled={!!appliedPromoCode || applyingPromo}
                      />
                    </FormControl>

                    <Button
                      type="button"
                      onClick={async () => {
                        const code = form.getValues("promoCode")?.trim();
                        if (!code) {
                          toast({
                            title: "No code",
                            description: "Enter a promo code first",
                            variant: "destructive",
                          });
                          return;
                        }
                        setApplyingPromo(true);
                        try {
                          const res = await redeemPromoCode(partySlug, String(code).trim())
                          if (!res.success) {
                            toast({
                              title: "Invalid promo",
                              description: "Code not valid",
                              variant: "destructive",
                            });
                            return;
                          }
                          setAppliedPromoCode(code);
                          toast({
                            title: "Promo applied",
                            description: "Ticket set to $0",
                            variant: "default",
                          });
                        } catch (err) {
                          toast({
                            title: "Error",
                            description: "Unable to apply promo",
                            variant: "destructive",
                          });
                        } finally {
                          setApplyingPromo(false);
                        }
                      }}
                      className={`px-3 py-2 rounded ${
                        appliedPromoCode ? "bg-green-700 hover:bg-green-800" : "bg-indigo-600 hover:bg-indigo-700"
                      } text-white`}
                      disabled={applyingPromo || !!appliedPromoCode}
                    >
                      {applyingPromo ? "Applying…" : appliedPromoCode ? "Applied" : "Apply"}
                    </Button>
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="min-w-[140px] h-10 px-3 flex items-center justify-center bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-700 rounded font-mono text-white text-lg tracking-widest">
                      {appliedPromoCode ?? <span className="text-zinc-500">{field.value || "—"}</span>}
                    </div>

                    {appliedPromoCode && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setAppliedPromoCode(null);
                          form.setValue("promoCode", "");
                          toast({ title: "Promo removed", description: "Standard pricing restored" });
                        }}
                        className="h-10 px-3 bg-zinc-900 border-zinc-700 text-white"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <FormDescription>
                    Have a promo code? Enter it and click Apply to redeem.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4 sm:grid-cols-4"
                    >
                      {party.organizations.map((org) => (
                        <FormItem
                          key={org}
                          className="flex items-center space-x-2 space-y-0"
                        >
                          <FormControl>
                            <RadioGroupItem value={org} />
                          </FormControl>
                          <FormLabel className="font-normal">{org}</FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentTierPrice > 0 && (
              <>
                {renderPaymentMethodSelector()}
                {renderVenmoPaymentButton()}
                {renderPaymentConfirmation()}
              </>
            )}

            {!party.allow_waitlist && (
              <div className="text-center text-red-400 font-semibold mb-4">
                Registration is closed.
              </div>
            )}

            {datingPoolEnabled && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">Join the matchmaking pool</p>
                    <p className="text-sm text-zinc-400">
                      Opt in to be paired based on your preferences. Closes 1 hour before the event.
                    </p>
                    {datingPoolLocked && (
                      <p className="text-sm text-amber-400 mt-1">
                        This pool is locked while we generate matches.
                      </p>
                    )}
                  </div>
                  <FormField
                    control={form.control}
                    name="joinDatingPool"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={datingPoolLocked}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("joinDatingPool") && !datingPoolLocked && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="genderIdentity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How do you identify?</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Woman, man, non-binary..."
                              {...field}
                              className="bg-zinc-900 border-zinc-800"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pronouns"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pronouns (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="she/her, he/him, they/them"
                              {...field}
                              className="bg-zinc-900 border-zinc-800"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="seeking"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Who do you want to be matched with?</FormLabel>
                          <div className="grid grid-cols-2 gap-2">
                            {seekingOptions.map((option) => {
                              const selected = field.value?.includes(option) ?? false;
                              return (
                                <label
                                  key={option}
                                  className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                                >
                                  <Checkbox
                                    checked={selected}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      const next = checked
                                        ? [...current, option]
                                        : current.filter((val: string) => val !== option);
                                      field.onChange(next);
                                    }}
                                  />
                                  <span>{option}</span>
                                </label>
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="connectionGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What are you looking for?</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Chill vibes, open to meeting someone serious."
                              className="bg-zinc-900 border-zinc-800"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vibe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Share your vibe (fun facts, music taste, etc.)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Two sentences to help us match you."
                              className="bg-zinc-900 border-zinc-800"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="allowPublicIntro"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <div className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 px-3 py-2">
                            <div>
                              <FormLabel>Let us intro you publicly?</FormLabel>
                              <FormDescription>
                                Your names may be shown together in the wrapped view.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !party.allow_waitlist}
              className={`w-full bg-linear-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 ${
                !party.allow_waitlist ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                <Music className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {currentTierPrice > 0
                ? `Submit Registration ($${currentTierPrice})`
                : "Submit Registration (Free)"}
            </Button>
          </form>
        </Form>
        <Toaster />
      </div>
    </div>
  );
}
