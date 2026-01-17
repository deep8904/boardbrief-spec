import { useState } from "react";
import { Link } from "react-router-dom";
import { Page } from "@/components/layout/Page";
import { CardShell } from "@/components/ui/CardShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useGameNights, useCreateGameNight, useJoinGameNight } from "@/lib/query/hooks/useGameNights";
import { useGames } from "@/lib/query/hooks/useGames";
import { Calendar, Plus, Users, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Nights() {
  const { data: activeNights, isLoading: activeLoading } = useGameNights("active");
  const { data: endedNights, isLoading: endedLoading } = useGameNights("ended");

  return (
    <Page
      title="Game Nights"
      subtitle="Plan and manage your game nights."
      actions={
        <CreateNightDialog>
          <PrimaryButton size="md">
            <Plus className="mr-2 h-4 w-4" />
            Create Night
          </PrimaryButton>
        </CreateNightDialog>
      }
    >
      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <CardShell variant="sky" padding="lg">
          <Calendar className="h-8 w-8 text-pastel-sky-dark mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Create a Game Night</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Host a new game night and invite your friends.
          </p>
          <CreateNightDialog>
            <PrimaryButton variant="secondary" size="sm">
              Create Night
            </PrimaryButton>
          </CreateNightDialog>
        </CardShell>

        <CardShell variant="lavender" padding="lg">
          <Users className="h-8 w-8 text-pastel-lavender-dark mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Join a Night</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enter an invite code to join an existing game night.
          </p>
          <JoinNightDialog>
            <PrimaryButton variant="secondary" size="sm">
              Join Night
            </PrimaryButton>
          </JoinNightDialog>
        </CardShell>
      </div>

      {/* Active Nights */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Active Nights</h2>
        {activeLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : activeNights && activeNights.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeNights.map((night) => (
              <Link key={night.id} to={`/app/nights/${night.id}`}>
                <CardShell variant="default" padding="lg" hover className="h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-pastel-mint flex items-center justify-center">
                      <span className="text-lg font-bold text-pastel-mint-dark">
                        {format(new Date(night.created_at), "d")}
                      </span>
                    </div>
                    <Chip variant="mint" size="sm">Active</Chip>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 truncate" title={night.title}>
                    {night.title}
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(night.created_at), "h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Future: Showing location or other metadata if available */}
                      <Users className="h-4 w-4" />
                      <span>{night.game?.name || "Game Night"}</span>
                    </div>
                  </div>
                </CardShell>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-secondary/20 rounded-lg">
            <p className="text-muted-foreground">No active game nights found.</p>
          </div>
        )}
      </div>

      {/* Past Nights */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Past Nights</h2>
        {endedLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : endedNights && endedNights.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {endedNights.map((night) => (
              <Link key={night.id} to={`/app/nights/${night.id}`}>
                <CardShell variant="default" padding="lg" hover className="opacity-75 hover:opacity-100 transition-opacity">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                      <span className="text-lg font-bold text-muted-foreground">
                        {format(new Date(night.created_at), "d")}
                      </span>
                    </div>
                    <Chip variant="default" size="sm">Ended</Chip>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 truncate">{night.title}</h3>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(night.created_at), "MMM d, yyyy")}
                  </div>
                </CardShell>
              </Link>
            ))}
          </div>
        ) : (
          <CardShell variant="default" padding="lg">
            <div className="text-center py-8">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Your completed game nights will appear here.
              </p>
            </div>
          </CardShell>
        )}
      </div>
    </Page>
  );
}

function CreateNightDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [gameId, setGameId] = useState("");

  const { data: games } = useGames();
  const createNight = useCreateGameNight();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !gameId) return;

    createNight.mutate(
      { title, gameId },
      {
        onSuccess: () => {
          setOpen(false);
          setTitle("");
          setGameId("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Game Night</DialogTitle>
          <DialogDescription>
            Start a new session. You'll get a join code to share with friends.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Night Title</Label>
            <Input
              id="title"
              placeholder="e.g. Friday Night Catan"
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
          <DialogFooter>
            <PrimaryButton type="submit" disabled={createNight.isPending}>
              {createNight.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Night
            </PrimaryButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function JoinNightDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");

  const joinNight = useJoinGameNight();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    joinNight.mutate(code, {
      onSuccess: () => {
        setOpen(false);
        setCode("");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Game Night</DialogTitle>
          <DialogDescription>
            Enter the join code shared by the host.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Join Code</Label>
            <Input
              id="code"
              placeholder="e.g. 123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <PrimaryButton type="submit" disabled={joinNight.isPending}>
              {joinNight.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Join Night
            </PrimaryButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
