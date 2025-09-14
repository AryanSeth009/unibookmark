import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold n8n-gradient-text mb-2">SmartBookmark.AI</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Check your email</CardTitle>
              <CardDescription>We've sent you a verification link</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Please check your email and click the verification link to activate your account. Once verified, you can
                start organizing your bookmarks with AI-powered intelligence.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
