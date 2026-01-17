import { PublicLayout } from "@/components/layout/PublicLayout";

export default function Privacy() {
  return (
    <PublicLayout>
      <div className="container py-12 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>
          <div className="prose prose-gray dark:prose-invert">
            <p className="text-muted-foreground mb-6">
              Last updated: January 2025
            </p>
            <div className="space-y-6 text-muted-foreground">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Information We Collect
                </h2>
                <p>
                  We collect information you provide directly to us, such as when you 
                  create an account, participate in game nights, or contact us for support.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  How We Use Your Information
                </h2>
                <p>
                  We use the information we collect to provide, maintain, and improve 
                  our services, and to communicate with you about your account.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Data Security
                </h2>
                <p>
                  We take reasonable measures to help protect your personal information 
                  from loss, theft, misuse, and unauthorized access.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
