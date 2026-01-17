import { PublicLayout } from "@/components/layout/PublicLayout";

export default function Terms() {
  return (
    <PublicLayout>
      <div className="container py-12 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-foreground mb-8">Terms of Service</h1>
          <div className="prose prose-gray dark:prose-invert">
            <p className="text-muted-foreground mb-6">
              Last updated: January 2025
            </p>
            <div className="space-y-6 text-muted-foreground">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Acceptance of Terms
                </h2>
                <p>
                  By accessing and using BoardBrief, you accept and agree to be bound 
                  by these Terms of Service and our Privacy Policy.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Use of Service
                </h2>
                <p>
                  You agree to use BoardBrief only for lawful purposes and in accordance 
                  with these Terms. You are responsible for maintaining the confidentiality 
                  of your account.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  User Content
                </h2>
                <p>
                  You retain ownership of any content you submit, but grant us a license 
                  to use, display, and distribute that content in connection with the service.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
