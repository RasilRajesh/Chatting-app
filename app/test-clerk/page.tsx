"use client";

export default function TestClerkPage() {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Clerk Configuration Test</h1>
      <div className="space-y-2">
        <p>
          <strong>Clerk Key Set:</strong> {clerkKey ? "Yes" : "No"}
        </p>
        <p>
          <strong>Key Length:</strong> {clerkKey?.length || 0} characters
        </p>
        <p>
          <strong>Key Preview:</strong> {clerkKey?.substring(0, 20)}...
        </p>
        <p>
          <strong>Key Ends With:</strong> {clerkKey?.slice(-10)}
        </p>
      </div>
      <div className="mt-4">
        <a href="/sign-up" className="text-blue-500 underline">
          Go to Sign Up Page
        </a>
      </div>
    </div>
  );
}
