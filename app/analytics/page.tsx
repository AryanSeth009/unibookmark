"use client"

import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { Sidebar } from "@/components/sidebar"
import { useCollections } from "@/hooks/use-collections"
import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function AnalyticsPage() {
	const { collections, isLoading: collectionsLoading } = useCollections()
	const router = useRouter()

	useEffect(() => {
		const checkAuth = async () => {
			const supabase = createClient()
			const {
				data: { user },
			} = await supabase.auth.getUser()
			if (!user) router.push("/auth/login")
		}
		checkAuth()
	}, [router])

	if (collectionsLoading) {
		return (
			<div className="flex h-screen bg-background text-foreground items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-muted-foreground">Loading analytics...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="flex h-screen bg-background text-foreground">
			<Sidebar
				collections={collections}
				selectedCollection="analytics"
				onSelectCollection={(id) => {
					if (id !== "analytics") router.push("/")
				}}
				onAddCollection={() => {}}
			/>
			<div className="flex-1 flex flex-col bg-background">
				<div className="flex-1 p-6 overflow-y-auto">
					<AnalyticsDashboard />
				</div>
			</div>
		</div>
	)
}
