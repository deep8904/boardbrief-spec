import { Page } from "@/components/layout/Page";
import { CardShell } from "@/components/ui/CardShell";
import { StatCard } from "@/components/ui/StatCard";
import { useProfile } from "@/lib/query/hooks/useProfile";
import { useStats } from "@/lib/query/hooks/useStats";
import { useGameNights } from "@/lib/query/hooks/useGameNights";
import { BookOpen, Calendar, Trophy, Users, ArrowRight, Clock, Star, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function Home() {
  const { data: profile } = useProfile();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: activeNights, isLoading: nightsLoading } = useGameNights("active");

  const displayName = profile?.display_name || profile?.username || "Gamer";

  return (
    <Page
      title={`Welcome back, ${displayName}!`}
      subtitle="What would you like to do today?"
    >
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          value={statsLoading ? "-" : stats?.gamesPlayed.toString() || "0"}
          label="Games played"
          variant="mint"
          icon={<Star className="h-5 w-5 text-pastel-mint-dark" />}
        />
        <StatCard
          value={statsLoading ? "-" : stats?.activeNights.toString() || "0"}
          label="Active nights"
          variant="sky"
          icon={<Calendar className="h-5 w-5 text-pastel-sky-dark" />}
        />
        <StatCard
          value={statsLoading ? "-" : stats?.friendsCount.toString() || "0"}
          label="Friends"
          variant="lavender"
          icon={<Users className="h-5 w-5 text-pastel-lavender-dark" />}
        />
        <StatCard
          value={statsLoading ? "-" : stats?.tournamentsCount.toString() || "0"}
          label="Tournaments"
          variant="peach"
          icon={<Trophy className="h-5 w-5 text-pastel-peach-dark" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/app/rules" className="block">
          <CardShell variant="mint" hover className="h-full">
            <BookOpen className="h-8 w-8 text-pastel-mint-dark mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Rules Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Look up rules and get AI-powered clarifications.
            </p>
          </CardShell>
        </Link>
        <Link to="/app/nights" className="block">
          <CardShell variant="sky" hover className="h-full">
            <Calendar className="h-8 w-8 text-pastel-sky-dark mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Game Nights</h3>
            <p className="text-sm text-muted-foreground">
              Plan and schedule your next game night.
            </p>
          </CardShell>
        </Link>
        <Link to="/app/tournaments" className="block">
          <CardShell variant="lavender" hover className="h-full">
            <Trophy className="h-8 w-8 text-pastel-lavender-dark mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Tournaments</h3>
            <p className="text-sm text-muted-foreground">
              Create brackets and track standings.
            </p>
          </CardShell>
        </Link>
        <Link to="/app/profile" className="block">
          <CardShell variant="peach" hover className="h-full">
            <Users className="h-8 w-8 text-pastel-peach-dark mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Your Profile</h3>
            <p className="text-sm text-muted-foreground">
              View your stats and manage settings.
            </p>
          </CardShell>
        </Link>
      </div>

      {/* Upcoming Nights */}
      <div className="grid gap-6">
        <CardShell variant="default" padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Upcoming Nights</h2>
            <Link to="/app/nights">
              <div className="flex items-center text-sm font-medium text-primary hover:underline cursor-pointer">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </Link>
          </div>

          {nightsLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeNights && activeNights.length > 0 ? (
            <div className="space-y-4">
              {activeNights.slice(0, 3).map((night) => (
                <Link key={night.id} to={`/app/nights/${night.id}`} className="block">
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-pastel-sky flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-pastel-sky-dark" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{night.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(night.created_at), "MMM d • h:mm a")} • {night.game?.name || "Game Night"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No active game nights. Why not create one?
            </div>
          )}
        </CardShell>
      </div>
    </Page>
  );
}
