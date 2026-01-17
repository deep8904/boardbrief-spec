import { useState } from "react";
import { Link } from "react-router-dom";
import { Page } from "@/components/layout/Page";
import { CardShell } from "@/components/ui/CardShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTournaments, useCreateTournament } from "@/lib/query/hooks/useTournaments";
import { useGames } from "@/lib/query/hooks/useGames";
import { useFriends } from "@/lib/query/hooks/useFriends";
import { useUser } from "@/lib/query/hooks/useSession";
import { Trophy, Plus, Users, Calendar, Award, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Tournaments() {
  const { data: activeTournaments, isLoading: activeLoading } = useTournaments("active");
  const { data: endedTournaments, isLoading: endedLoading } = useTournaments("ended");

  return (
    <Page
      title="Tournaments"
      subtitle="Create and manage competitive tournaments."
      actions={
        <CreateTournamentDialog>
          <PrimaryButton size="md">
            <Plus className="mr-2 h-4 w-4" />
            Create Tournament
          </PrimaryButton>
        </CreateTournamentDialog>
      }
    >
      {/* Quick Actions */}
      <CardShell variant="lavender" padding="lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-white/60 flex items-center justify-center">
            <Trophy className="h-7 w-7 text-pastel-lavender-dark" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">Create a Tournament</h3>
            <p className="text-sm text-muted-foreground">
              Set up brackets, invite players, and track standings.
            </p>
          </div>
          <CreateTournamentDialog>
            <PrimaryButton variant="secondary" size="md">
              Get Started
            </PrimaryButton>
          </CreateTournamentDialog>
        </div>
      </CardShell>

      {/* Active Tournaments */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Active Tournaments</h2>
        {activeLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : activeTournaments && activeTournaments.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeTournaments.map((tournament) => (
              <Link key={tournament.id} to={`/app/tournaments/${tournament.id}`}>
                <CardShell variant="default" padding="lg" hover className="h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-pastel-peach flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-pastel-peach-dark" />
                    </div>
                    <Chip variant="peach" size="sm">In Progress</Chip>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 truncate" title={tournament.title}>
                    {tournament.title}
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{tournament.tournament_participants?.length || 0} players</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{tournament.format === "round_robin" ? "Round Robin" : "Bracket"}</span>
                    </div>
                  </div>
                  {/* Leader logic would go here if we computed it on client or returned it */}
                </CardShell>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-secondary/20 rounded-lg">
            <p className="text-muted-foreground">No active tournaments found.</p>
          </div>
        )}
      </div>

      {/* Completed Tournaments */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Completed</h2>
        {endedLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : endedTournaments && endedTournaments.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {endedTournaments.map((tournament) => (
              <Link key={tournament.id} to={`/app/tournaments/${tournament.id}`}>
                <CardShell variant="default" padding="lg" hover className="opacity-75 hover:opacity-100 transition-opacity">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <Chip variant="default" size="sm">Finished</Chip>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 truncate">{tournament.title}</h3>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(tournament.created_at), "MMM d, yyyy")}
                  </div>
                </CardShell>
              </Link>
            ))}
          </div>
        ) : (
          <CardShell variant="default" padding="lg">
            <div className="text-center py-8">
              <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Your completed tournaments will appear here.
              </p>
            </div>
          </CardShell>
        )}
      </div>
    </Page>
  );
}

function CreateTournamentDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [gameId, setGameId] = useState("");
  const [format, setFormat] = useState<"single_elimination" | "round_robin">("single_elimination");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const { data: games } = useGames();
  const { data: friends } = useFriends();
  const { user } = useUser();
  const createTournament = useCreateTournament();

  const handleFriendToggle = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !gameId) return;

    // Ensure host is included if not selected
    const participants = user?.id
      ? Array.from(new Set([...selectedFriends, user.id]))
      : selectedFriends;

    createTournament.mutate(
      { title, gameId, format, participantUserIds: participants },
      {
        onSuccess: () => {
          setOpen(false);
          setTitle("");
          setGameId("");
          setSelectedFriends([]);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Tournament</DialogTitle>
          <DialogDescription>
            Set up a new tournament with friends.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Tournament Name</Label>
            <Input
              id="title"
              placeholder="e.g. Catan Championship 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="game">Game</Label>
            <Select value={gameId} onValueChange={setGameId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a game" />
              </SelectTrigger>
              <SelectContent>
                {games?.map((game) => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={(v: any) => setFormat(v)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_elimination">Single Elimination (Bracket)</SelectItem>
                <SelectItem value="round_robin">Round Robin (League)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Participants (Friends)</Label>
            {friends && friends.length > 0 ? (
              <div className="space-y-2 border rounded-md p-3 max-h-40 overflow-y-auto">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`friend-${friend.id}`}
                      checked={selectedFriends.includes(friend.requester_id === user?.id ? friend.addressee_id : friend.requester_id)}
                      onCheckedChange={() => handleFriendToggle(friend.requester_id === user?.id ? friend.addressee_id : friend.requester_id)}
                    />
                    <Label htmlFor={`friend-${friend.id}`} className="text-sm font-normal cursor-pointer">
                      {friend.profile?.display_name || friend.profile?.username || "Unknown"}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Add friends to invite them to tournaments.</p>
            )}
            <p className="text-xs text-muted-foreground">You are automatically included.</p>
          </div>

          <DialogFooter>
            <PrimaryButton type="submit" disabled={createTournament.isPending}>
              {createTournament.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Tournament
            </PrimaryButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
