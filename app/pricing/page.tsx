"use client"

import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { Button } from "@/components/ui/button" // Assuming these are Tailwind-styled components
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card" // Assuming these are Tailwind-styled components
import Link from 'next/link'
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { useCollections } from "@/hooks/use-collections"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

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
            "Community Support"
        ],
        unavailableFeatures: [
            "Advanced Filters (Tags & Date)",
            "Custom Collections",
            "Priority Support",
            "Cross-Device Sync (Future)",
            "AI-Powered Suggestions (Future)"
        ],
        buttonText: "Get Started Free"
    },
    {
        name: "Pro 5GB",
        price: "59", // Rs 59
        storage: "5 GB",
        features: [
            "Unlimited Bookmarks",
            "Basic Categorization",
            "Keyword Search",
            "Advanced Filters (Tags & Date)",
            "Custom Collections",
            "Priority Support"
        ],
        unavailableFeatures: [
            "Cross-Device Sync (Future)",
            "AI-Powered Suggestions (Future)"
        ],
        buttonText: "Choose Pro 5GB"
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
            "AI-Powered Suggestions (Future)" // Assuming this comes with higher tiers
        ],
        unavailableFeatures: [],
        buttonText: "Choose Pro 10GB"
    }
];

export default function PricingPage() {
    const [selectedCollection, setSelectedCollection] = useState<string>("all")
    const router = useRouter()
    const { toast } = useToast()

    const { collections, isLoading: collectionsLoading, mutate: mutateCollections, createCollection } = useCollections()

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient()
            const { data: { user }, } = await supabase.auth.getUser()

            if (!user) {
                router.push("/auth/login")
            }
        }
        checkAuth()
    }, [router])

    const handleAddCollection = async (name: string, parentId?: string) => {
        try {
            await createCollection(name, parentId)
            mutateCollections()
            toast({
                title: "Collection created",
                description: `"${name}" collection has been created.`,
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create collection. Please try again.",
                variant: "destructive",
            })
        }
    }

    if (collectionsLoading) {
        return (
            <div className="flex h-screen bg-background text-foreground items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading collections...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-n8n-dark text-white font-inter relative flex"> {/* Applied n8n-dark background and Inter font */}
            {/* Elegant Gradient Background - n8n style */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] 
                    bg-gradient-to-r from-n8n-purple/10 via-transparent to-n8n-teal/10 
                    rotate-[-45deg] opacity-30 blur-3xl"></div>
            </div>
            
            <div className="fixed p-4 inset-0 z-0 select-none pointer-events-none">
                <div className="absolute top-0 right-0 w-full h-full">
                    {/* Purple gradient lines - adjusted for n8n purple */}
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-[linear-gradient(45deg,transparent_45%,rgba(108,71,255,0.1)_45%,rgba(108,71,255,0.1)_55%,transparent_55%)]" />
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-[linear-gradient(45deg,transparent_35%,rgba(108,71,255,0.1)_35%,rgba(108,71,255,0.1)_45%,transparent_45%)]" />
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-[linear-gradient(45deg,transparent_25%,rgba(108,71,255,0.1)_25%,rgba(108,71,255,0.1)_35%,transparent_35%)]" />
                </div>
            </div>
            
            <Sidebar
                collections={collections}
                selectedCollection={selectedCollection}
                onSelectCollection={setSelectedCollection}
                onAddCollection={handleAddCollection}
            />

            <div className="flex-1 overflow-y-auto">
                <div className="container relative mx-auto px-4 py-16 z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-6xl font-bold 
                            bg-gradient-to-r from-n8n-purple to-n8n-teal 
                            text-transparent bg-clip-text pb-2">
                            Pricing Plans
                        </h1>
                        <p className="text-xl max-w-3xl mx-auto text-n8n-gray-light mt-4">
                            Unlock the full potential of your bookmarks. Choose a plan that suits your storage and feature needs.
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
                                className={`bg-n8n-ui backdrop-blur-xl border border-white/10 
                                    hover:border-n8n-purple/30 
                                    transition-all duration-300 
                                    group 
                                    transform hover:scale-105 
                                    hover:shadow-2xl
                                    ${plan.name.startsWith('Pro') ? 'border-2 border-n8n-purple/50' : ''}`}
                            >
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-2xl text-white">
                                            {plan.name}
                                        </CardTitle>
                                        {/* Show "Most Popular" badge on the middle tier */}
                                        {plan.name === 'Pro 5GB' && (
                                            <span className="bg-n8n-purple/20 text-n8n-purple 
                                                px-3 py-1 rounded-full text-xs font-semibold">
                                                Most Popular
                                            </span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="text-4xl font-bold">
                                        {plan.price === "0" ? 'Free' : `₹${plan.price}/mo`} {/* Display price in INR */}
                                    </div>
                                    <div className="text-lg font-semibold text-n8n-gray-light">
                                        Storage: <span className="text-white">{plan.storage}</span>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-white/80">Features</h3>
                                        {plan.features.map((feature) => (
                                            <div
                                                key={feature}
                                                className="flex items-center space-x-2 text-white/70"
                                            >
                                                <Check className="w-5 h-5 text-n8n-teal" /> {/* n8n teal for checkmarks */}
                                                <span>{feature}</span>
                                            </div>
                                        ))}

                                        {plan.unavailableFeatures.map((feature) => (
                                            <div
                                                key={feature}
                                                className="flex items-center space-x-2 text-white/40 line-through"
                                            >
                                                <X className="w-5 h-5 text-n8n-pink/50" /> {/* n8n pink for unavailable features */}
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        variant="outline"
                                        className={`w-full rounded-full 
                                            bg-white/5 border-white/10 
                                            text-white hover:bg-n8n-purple/20 
                                            transition-colors duration-300
                                            group-hover:bg-n8n-purple/30
                                            ${plan.name.startsWith('Pro') ? 'bg-n8n-purple border-n8n-purple hover:bg-n8n-purple/80' : ''}`}
                                    >
                                        {plan.buttonText}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
                        className="mt-16 text-center bg-n8n-ui/60 backdrop-blur-xl rounded-lg p-8 
                            border border-white/10 shadow-lg hover:shadow-xl"
                    >
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Need More Storage or Custom Features?
                        </h2>
                        <p className="text-n8n-gray-light max-w-2xl mx-auto mb-6">
                            For larger storage needs, team accounts, or bespoke integrations,
                            contact us to tailor a plan that perfectly fits your requirements.
                        </p>
                        <Button
                            className="bg-gradient-to-r from-n8n-purple to-n8n-teal 
                                text-white rounded-full px-8 py-3 
                                hover:from-n8n-purple/80 hover:to-n8n-teal/80 
                                transition-all duration-300"
                        >
                            Contact Sales
                        </Button>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}