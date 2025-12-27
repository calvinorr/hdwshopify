import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 py-12 px-4">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
            headerTitle: "font-heading",
            formButtonPrimary:
              "bg-stone-900 hover:bg-stone-800 text-white",
          },
        }}
      />
    </div>
  );
}
