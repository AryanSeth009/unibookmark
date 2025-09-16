"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts"
import { Activity, Bookmark, Search, Tag } from "lucide-react"

interface AnalyticsData {
	overview: { totalBookmarks: number; newBookmarks: number; totalCollections: number; totalSearches: number }
	topBookmarks: Array<{ bookmark: { id: string; title: string; url: string; favicon_url?: string }; visits: number }>
	recentSearches: Array<{ query: string; created_at: string }>
	collections: Array<{ id: string; name: string; color: string; count: number }>
	activity: Array<{ date: string; bookmarks: number }>
	period: string
}

export function AnalyticsDashboard() {
	const [data, setData] = useState<AnalyticsData | null>(null)
	const [loading, setLoading] = useState(false)
	const [period, setPeriod] = useState("7d")
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let ignore = false
		async function load() {
			try {
				setLoading(true)
				setError(null)
				const res = await fetch(`/api/analytics?period=${period}`, { credentials: "include" })
				if (!res.ok) throw new Error(`HTTP ${res.status}`)
				const json = (await res.json()) as AnalyticsData
				if (!ignore) setData(json)
			} catch (e: any) {
				if (!ignore) setError(e.message || "Failed to load analytics")
			} finally {
				if (!ignore) setLoading(false)
			}
		}
		load()
		return () => {
			ignore = true
		}
	}, [period])

	const COLORS = ["#6c47ff", "#00d8a4", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold">Analytics</h2>
					<div className="h-10 w-32 bg-muted animate-pulse rounded" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{Array.from({ length: 4 }).map((_, i) => (
						<Card key={i}>
							<CardContent className="p-6">
								<div className="h-4 bg-muted animate-pulse rounded mb-2" />
								<div className="h-8 bg-muted animate-pulse rounded" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold">Analytics</h2>
					<Button variant="outline" onClick={() => setPeriod(period)}>
						Retry
					</Button>
				</div>
				<Card>
					<CardContent className="p-6 text-sm text-muted-foreground">{error}</CardContent>
				</Card>
			</div>
		)
	}

	if (!data) return null

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Analytics</h2>
					<p className="text-muted-foreground">Insights into your bookmark usage and activity</p>
				</div>
				<Select value={period} onValueChange={setPeriod}>
					<SelectTrigger className="w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="7d">Last 7 days</SelectItem>
						<SelectItem value="30d">Last 30 days</SelectItem>
						<SelectItem value="90d">Last 90 days</SelectItem>
						<SelectItem value="1y">Last year</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">Total Bookmarks</p>
								<p className="text-2xl font-bold">{data.overview.totalBookmarks}</p>
							</div>
							<Bookmark className="h-8 w-8 text-primary" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">New This Period</p>
								<p className="text-2xl font-bold">{data.overview.newBookmarks}</p>
							</div>
							<Activity className="h-8 w-8 text-green-500" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">Collections</p>
								<p className="text-2xl font-bold">{data.overview.totalCollections}</p>
							</div>
							<Tag className="h-8 w-8 text-blue-500" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">Searches</p>
								<p className="text-2xl font-bold">{data.overview.totalSearches}</p>
							</div>
							<Search className="h-8 w-8 text-orange-500" />
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">Activity Over Time</CardTitle>
						<CardDescription>Bookmark creation activity for selected period</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={data.activity}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" fontSize={12} />
									<YAxis fontSize={12} />
									<Tooltip />
									<Line type="monotone" dataKey="bookmarks" stroke="#6c47ff" strokeWidth={2} dot={false} />
								</LineChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">Collections Distribution</CardTitle>
						<CardDescription>Bookmarks per collection</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie data={data.collections} dataKey="count" cx="50%" cy="50%" outerRadius={80} label>
										{data.collections.map((entry, idx) => (
											<Cell key={entry.id} fill={COLORS[idx % COLORS.length]} />
										))}
									</Pie>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
