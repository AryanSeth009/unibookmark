"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Wand2, Tags, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AICategorization {
  category: string
  subcategory?: string
  tags: string[]
  keywords: string[]
  summary: string
  confidence: number
}

interface AICategorizationPanelProps {
  bookmarkId?: string
  title: string
  url: string
  description?: string
  onCategorized?: (result: AICategorization) => void
}

export function AICategorizationPanel({
  bookmarkId,
  title,
  url,
  description,
  onCategorized,
}: AICategorizationPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [categorization, setCategorization] = useState<AICategorization | null>(null)
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const { toast } = useToast()

  const handleCategorize = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/bookmarks/categorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookmarkId,
          title,
          url,
          description,
        }),
      })

      if (!response.ok) {
        throw new Error("Categorization failed")
      }

      const data = await response.json()
      setCategorization(data.categorization)
      onCategorized?.(data.categorization)

      toast({
        title: "AI Categorization Complete",
        description: `Categorized as "${data.categorization.category}" with ${Math.round(data.categorization.confidence * 100)}% confidence`,
      })
    } catch (error) {
      console.error("Categorization error:", error)
      toast({
        title: "Categorization Failed",
        description: "Unable to categorize bookmark with AI",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestTags = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/bookmarks/suggest-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          url,
          description,
          category: categorization?.category,
        }),
      })

      if (!response.ok) {
        throw new Error("Tag suggestion failed")
      }

      const data = await response.json()
      setSuggestedTags(data.suggested)

      toast({
        title: "Tags Suggested",
        description: `Generated ${data.suggested.length} tag suggestions`,
      })
    } catch (error) {
      console.error("Tag suggestion error:", error)
      toast({
        title: "Tag Suggestion Failed",
        description: "Unable to suggest tags",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI-Powered Organization
        </CardTitle>
        <CardDescription>Let AI automatically categorize and organize your bookmark</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!categorization ? (
          <div className="space-y-4">
            <Button onClick={handleCategorize} disabled={isLoading} className="w-full">
              <Wand2 className="w-4 h-4 mr-2" />
              {isLoading ? "Analyzing..." : "Categorize with AI"}
            </Button>

            <Button
              variant="outline"
              onClick={handleSuggestTags}
              disabled={isLoading}
              className="w-full bg-transparent"
            >
              <Tags className="w-4 h-4 mr-2" />
              {isLoading ? "Generating..." : "Suggest Tags"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Category</span>
                <Badge variant="secondary">{categorization.category}</Badge>
              </div>

              {categorization.subcategory && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Subcategory</span>
                  <Badge variant="outline">{categorization.subcategory}</Badge>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-sm font-medium">Confidence</span>
                <Progress value={categorization.confidence * 100} className="h-2" />
                <span className="text-xs text-muted-foreground">
                  {Math.round(categorization.confidence * 100)}% confident
                </span>
              </div>
            </div>

            {categorization.tags.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">AI-Generated Tags</span>
                <div className="flex flex-wrap gap-1">
                  {categorization.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {categorization.keywords.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Keywords</span>
                <div className="flex flex-wrap gap-1">
                  {categorization.keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {categorization.summary && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">AI Summary</span>
                </div>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{categorization.summary}</p>
              </div>
            )}

            <Button variant="outline" onClick={handleCategorize} disabled={isLoading} className="w-full bg-transparent">
              <Wand2 className="w-4 h-4 mr-2" />
              Re-categorize
            </Button>
          </div>
        )}

        {suggestedTags.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Suggested Tags</span>
            <div className="flex flex-wrap gap-1">
              {suggestedTags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => {
                    // Handle tag selection
                    toast({
                      title: "Tag Added",
                      description: `Added "${tag}" to bookmark tags`,
                    })
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
