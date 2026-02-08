export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign-in failed</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We could not complete the Google sign-in flow. Please try again, or contact support if the issue
          continues.
        </p>
      </div>
    </div>
  )
}
