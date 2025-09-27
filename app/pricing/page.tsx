"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming these are Tailwind-styled components
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Assuming these are Tailwind-styled components
import Link from "next/link";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { useCollections } from "@/hooks/use-collections";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

// Define the pricing plans for SmartBookmark.Ai
const pricingPlans = [
  {
    name: "Free",
    price: "0", // Free tier has 0 price
    storage: "1 GB",
    features: [
      "Unlimited Bookmarks",
      "Basic Categorization",
      "Keyword Search",
      "Community Support",
    ],
    unavailableFeatures: [
      "Advanced Filters (Tags & Date)",
      "Custom Collections",
      "Priority Support",
      "Cross-Device Sync (Future)",
      "AI-Powered Suggestions (Future)",
    ],
    buttonText: "Get Started Free",
  },
  {
    name: "Pro 5GB",
    storage: "5 GB",
    features: [
      "Unlimited Bookmarks",
      "Basic Categorization",
      "Keyword Search",
      "Advanced Filters (Tags & Date)",
      "Custom Collections",
      "Priority Support",
    ],
    unavailableFeatures: [
      "Cross-Device Sync (Future)",
      "AI-Powered Suggestions (Future)",
    ],
    paymentOptions: [
      {
        price: "708", // 59 * 12
        displayPrice: "59",
        type: "annually",
        description: "/month, billed annually",
        buttonText: "Choose Pro 5GB (Annual)",
      },
      {
        price: "89",
        displayPrice: "89",
        type: "monthly",
        description: "/month",
        buttonText: "Choose Pro 5GB (Monthly)",
      },
    ],
  },
  {
    name: "Pro 10GB",
    price: "149", // Rs 149
    storage: "10 GB",
    features: [
      "Unlimited Bookmarks",
      "Basic Categorization",
      "Keyword Search",
      "Advanced Filters (Tags & Date)",
      "Custom Collections",
      "Priority Support",
      "Cross-Device Sync (Future)", // Assuming this comes with higher tiers
      "AI-Powered Suggestions (Future)", // Assuming this comes with higher tiers
    ],
    unavailableFeatures: [],
    buttonText: "Choose Pro 10GB",
  },
];

export default function PricingPage() {
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const router = useRouter();
  const { toast } = useToast();
  const { profile, isLoading: isProfileLoading } = useProfile();

  const {
    collections,
    isLoading: collectionsLoading,
    mutate: mutateCollections,
    createCollection,
  } = useCollections();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
      }
    };
    checkAuth();
  }, [router]);

  const handleClose = () => {
    router.push("/");
  };

  const handleAddCollection = async (name: string, parentId?: string) => {
    try {
      await createCollection(name, parentId);
      mutateCollections();
      toast({
        title: "Collection created",
        description: `"${name}" collection has been created.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create collection. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (collectionsLoading) {
    return (
      <div className="flex h-screen bg-background text-foreground items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-inter relative flex">
      {" "}
      {/* Applied n8n-dark background and Inter font */}
      {/* Elegant Gradient Background - n8n style */}
      <div className="fixed p-4 inset-0 z-0 select-none pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full">
          {/* Purple gradient lines - adjusted for n8n purple */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[linear-gradient(45deg,transparent_45%,rgba(108,71,255,0.1)_45%,rgba(108,71,255,0.1)_55%,transparent_55%)]" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[linear-gradient(45deg,transparent_35%,rgba(108,71,255,0.1)_35%,rgba(108,71,255,0.1)_45%,transparent_45%)]" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[linear-gradient(45deg,transparent_25%,rgba(108,71,255,0.1)_25%,rgba(108,71,255,0.1)_35%,transparent_35%)]" />
        </div>
      </div>
      
        
      <div className="flex-1 overflow-y-auto">
        <div className="absolute top-4 left-4 z-20">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-foreground hover:bg-muted"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
        <div className="container relative mx-auto px-4 py-16 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h1
              className="text-6xl font-bold 
                            bg-gradient-to-r from-n8n-purple to-n8n-teal 
                            text-transparent bg-clip-text pb-2"
            >
              Pricing Plans
            </h1>
            <p className="text-xl max-w-3xl mx-auto text-foreground mt-4">
              Unlock the full potential of your bookmarks. Choose a plan that
              suits your storage and feature needs.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="grid md:grid-cols-3 gap-8"
          >
            {pricingPlans.map((plan, index) => (
              <Card
                key={plan.name}
                className={`bg-card backdrop-blur-xl border border-border 
                                    hover:border-primary/30 
                                    transition-all duration-300 
                                    group 
                                    transform hover:scale-105 
                                    hover:shadow-2xl
                                    ${
                                      plan.name.startsWith("Pro")
                                        ? "border-2 border-primary/50"
                                        : ""
                                    }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl text-foreground">
                      {plan.name}
                    </CardTitle>
                    {/* Show "Most Popular" badge on the middle tier */}
                    {plan.name === "Pro 5GB" && (
                      <span
                        className="bg-n8n-purple/20 text-n8n-purple 
                                                px-3 py-1 rounded-full text-xs font-semibold"
                      >
                        Most Popular
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-4xl font-bold">
                    {plan.price === "0" ? "Free" : `₹${plan.price}/mo`}{" "}
                    {/* Display price in INR */}
                  </div>
                  {plan.paymentOptions ? (
                    plan.paymentOptions.map((option) => (
                      <div key={option.type} className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">
                          {option.displayPrice === "0" ? "Free" : `₹${option.displayPrice}`}
                        </span>
                        <span className="text-lg font-semibold text-foreground">
                          {option.description}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        {plan.price === "0" ? "Free" : `₹${plan.price}`}
                      </span>
                      <span className="text-lg font-semibold text-foreground">
                        /mo
                      </span>
                    </div>
                  )}

                  <div className="text-lg font-semibold text-foreground">
                    Storage:{" "}
                    <span className="text-foreground">{plan.storage}</span>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">
                      Features
                    </h3>
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center space-x-2 text-foreground"
                      >
                        <Check className="w-5 h-5 text-primary" />{" "}
                        {/* n8n teal for checkmarks */}
                        <span>{feature}</span>
                      </div>
                    ))}

                    {plan.unavailableFeatures.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center space-x-2 text-muted-foreground line-through"
                      >
                        <X className="w-5 h-5 text-destructive" />{" "}
                        {/* n8n pink for unavailable features */}
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className={`w-full rounded-full 
                                            bg-background border-border 
                                            text-foreground hover:bg-primary/20 
                                            transition-colors duration-300
                                            group-hover:bg-primary/30
                                            ${
                                              plan.name.startsWith("Pro")
                                                ? "bg-primary border-primary hover:bg-primary/80"
                                                : ""
                                            }`}
                  >
                    {plan.buttonText}
                  </Button>
                  {plan.paymentOptions ? (
                    plan.paymentOptions.map((option) => (
                      <Button
                        key={option.type}
                        variant="outline"
                        className={cn(
                          "w-full rounded-full transition-colors duration-300 mt-2",
                          option.type === "annually" ? "bg-primary border-primary hover:bg-primary/80 text-primary-foreground" : "bg-background border-border text-foreground hover:bg-primary/20 group-hover:bg-primary/30"
                        )}
                        onClick={async () => {
                          if (!profile?.id) {
                            toast({
                              title: "Error",
                              description:
                                "User not logged in or profile not loaded.",
                              variant: "destructive",
                            });
                            return;
                          }
                          try {
                            const response = await fetch(
                              "/api/phonepe/initiate-payment",
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  amount: option.price,
                                  planName: `${plan.name} (${option.type})`,
                                  userId: profile.id,
                                }),
                              }
                            );
                            const data = await response.json();
                            if (data.url) {
                              router.push(data.url);
                            } else {
                              throw new Error(
                                data.error || "Failed to initiate PhonePe payment"
                              );
                            }
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description:
                                error.message ||
                                "Something went wrong with PhonePe payment.",
                              variant: "destructive",
                            });
                            console.error("PhonePe payment error:", error);
                          }
                        }}
                      >
                        {option.buttonText}
                      </Button>
                    ))
                  ) : (
                    plan.name.startsWith("Pro") && (
                      <Button
                        variant="outline"
                        className="w-full rounded-full bg-yellow-500 border-yellow-600 text-white hover:bg-yellow-600 transition-colors duration-300 mt-2"
                        onClick={async () => {
                          if (!profile?.id) {
                            toast({
                              title: "Error",
                              description:
                                "User not logged in or profile not loaded.",
                              variant: "destructive",
                            });
                            return;
                          }
                          try {
                            const response = await fetch(
                              "/api/phonepe/initiate-payment",
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  amount: plan.price,
                                  planName: plan.name,
                                  userId: profile.id,
                                }),
                              }
                            );
                            const data = await response.json();
                            if (data.url) {
                              router.push(data.url);
                            } else {
                              throw new Error(
                                data.error || "Failed to initiate PhonePe payment"
                              );
                            }
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description:
                                error.message ||
                                "Something went wrong with PhonePe payment.",
                              variant: "destructive",
                            });
                            console.error("PhonePe payment error:", error);
                          }
                        }}
                      >
                        Pay with PhonePe UPI
                      </Button>
                    )
                  )}
                </CardFooter>
              </Card>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
            className="mt-16 text-center bg-card/60 backdrop-blur-xl rounded-lg p-8 
                            border border-border shadow-lg hover:shadow-xl"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Need More Storage or Custom Features?
            </h2>
            <p className="text-foreground max-w-2xl mx-auto mb-6">
              For larger storage needs, team accounts, or bespoke integrations,
              contact us to tailor a plan that perfectly fits your requirements.
            </p>
            <Button
              className="bg-gradient-to-r from-primary to-accent 
                                text-primary-foreground rounded-full px-8 py-3 
                                hover:from-primary/80 hover:to-accent/80 
                                transition-all duration-300"
            >
              Contact Sales
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
