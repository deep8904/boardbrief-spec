import { Link, useNavigate } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Container } from "@/components/layout/Container";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { CardShell } from "@/components/ui/CardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Chip } from "@/components/ui/chip";
import { useUser } from "@/lib/query/hooks/useSession";
import { useEffect } from "react";
import { BookOpen, Calendar, Trophy, Users, ArrowRight, Sparkles } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useUser();

  // Redirect to app if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/app/home");
    }
  }, [isLoading, isAuthenticated, navigate]);

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <Container className="py-16 md:py-24 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left: Headline & CTA */}
            <div className="space-y-8">
              <Chip variant="primary" icon={<Sparkles className="h-3 w-3" />}>
                Game Night, Simplified
              </Chip>
              <h1 className="text-hero">
                Master every game night,{" "}
                <span className="text-primary">effortlessly</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Your personal assistant for board game rules, game night planning, 
                and tournament tracking. Never fumble through rulebooks again.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <PrimaryButton href="/login" size="lg">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </PrimaryButton>
                <PrimaryButton href="/login" variant="secondary" size="lg">
                  Log in
                </PrimaryButton>
              </div>
              {/* Social proof */}
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border-2 border-background flex items-center justify-center"
                    >
                      <span className="text-xs font-medium text-primary">
                        {String.fromCharCode(64 + i)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">500+</span> game nights hosted
                </p>
              </div>
            </div>

            {/* Right: Description card */}
            <div className="hidden lg:block">
              <CardShell variant="default" padding="lg" className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Your gaming needs evolve — and your tools should too. From managing complex rule lookups to planning life's biggest game nights, 
                  BoardBrief adapts to support your goals at every stage.
                </p>
              </CardShell>
            </div>
          </div>
        </Container>
      </section>

      {/* Mosaic Card Grid - Like Haven screenshot */}
      <section className="pb-12 md:pb-20">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            {/* Large image card */}
            <CardShell 
              variant="image" 
              padding="none" 
              className="md:col-span-2 md:row-span-2 min-h-[280px] md:min-h-[400px] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/80 to-secondary/60" />
              <div className="absolute inset-0 flex items-end p-6">
                <div>
                  <BookOpen className="h-8 w-8 text-primary mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">Rules at your fingertips</h3>
                  <p className="text-sm text-muted-foreground">AI-powered clarifications</p>
                </div>
              </div>
            </CardShell>

            {/* Accent orange card (like credit card) */}
            <CardShell 
              variant="accent" 
              padding="lg" 
              className="min-h-[180px] md:min-h-[190px] flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium opacity-90">BoardBrief</span>
                <Trophy className="h-5 w-5 opacity-80" />
              </div>
              <div>
                <p className="text-sm opacity-80 mb-1">Tournaments</p>
                <p className="text-xl font-bold">Create & Track</p>
              </div>
            </CardShell>

            {/* Medium image card */}
            <CardShell 
              variant="image" 
              padding="none" 
              className="min-h-[180px] md:min-h-[190px] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pastel-mint via-pastel-mint/80 to-pastel-mint/60" />
              <div className="absolute inset-0 flex items-end p-6">
                <div>
                  <Calendar className="h-6 w-6 text-pastel-mint-dark mb-2" />
                  <p className="text-sm font-medium text-pastel-mint-dark">Game Nights</p>
                </div>
              </div>
            </CardShell>

            {/* Stats row */}
            <CardShell variant="default" padding="lg" className="flex flex-col justify-center">
              <p className="text-3xl font-bold text-foreground mb-1">24/7</p>
              <p className="text-sm text-muted-foreground">Rules assistance</p>
            </CardShell>

            {/* Small card with stats */}
            <CardShell 
              variant="image" 
              padding="none" 
              className="min-h-[180px] md:min-h-[190px] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pastel-sky via-pastel-sky/80 to-pastel-sky/60" />
              <div className="absolute inset-0 flex items-end p-6">
                <div>
                  <Users className="h-6 w-6 text-pastel-sky-dark mb-2" />
                  <p className="text-sm font-medium text-pastel-sky-dark">Friends & Groups</p>
                </div>
              </div>
            </CardShell>
          </div>
        </Container>
      </section>

      {/* Stats Section - Like "Why Choose Us" from screenshot */}
      <section className="py-12 md:py-20">
        <Container>
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-muted-foreground mb-3">Why Choose Us</p>
            <h2 className="text-section">Everything you need for game night</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              value="100+"
              label="Board games supported"
              variant="lavender"
            />
            <StatCard
              value="5min"
              label="Average rule lookup"
              variant="mint"
            />
            <StatCard
              value="24/7"
              label="AI assistance"
              variant="sky"
            />
            <StatCard
              value="Free"
              label="To get started"
              variant="peach"
            />
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 bg-secondary/30">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-section mb-4">Powerful features, simple experience</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              BoardBrief brings together everything you need to run the perfect game night.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <CardShell variant="mint" hover>
              <BookOpen className="h-8 w-8 text-pastel-mint-dark mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Rules Assistant</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered rule lookups and clarifications for hundreds of board games.
              </p>
            </CardShell>

            <CardShell variant="sky" hover>
              <Calendar className="h-8 w-8 text-pastel-sky-dark mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Game Nights</h3>
              <p className="text-sm text-muted-foreground">
                Plan, schedule, and manage your game nights with friends.
              </p>
            </CardShell>

            <CardShell variant="lavender" hover>
              <Trophy className="h-8 w-8 text-pastel-lavender-dark mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Rankings</h3>
              <p className="text-sm text-muted-foreground">
                Track wins, losses, and player statistics across all your games.
              </p>
            </CardShell>

            <CardShell variant="peach" hover>
              <Users className="h-8 w-8 text-pastel-peach-dark mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Tournaments</h3>
              <p className="text-sm text-muted-foreground">
                Organize competitive tournaments with brackets and standings.
              </p>
            </CardShell>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <Container size="narrow">
          <CardShell variant="default" padding="lg" className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to level up your game nights?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Join hundreds of board game enthusiasts who never fumble through rulebooks again.
            </p>
            <PrimaryButton href="/login" size="lg">
              Get started for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </PrimaryButton>
          </CardShell>
        </Container>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <Container className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
                <span className="text-xs font-bold text-primary-foreground">BB</span>
              </div>
              <span className="text-sm font-semibold text-foreground">BoardBrief</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </Container>
      </footer>
    </PublicLayout>
  );
}
