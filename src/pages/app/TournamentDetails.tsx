import { useParams, useNavigate } from "react-router-dom";
import { Confetti } from "@/components/ui/Confetti";
import { Page } from "@/components/layout/Page";
import { CardShell } from "@/components/ui/CardShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Chip } from "@/components/ui/chip";
import { useTournament, useReportMatch } from "@/lib/query/hooks/useTournaments";
import { useUser } from "@/lib/query/hooks/useSession";
import { Loader2, Trophy, Clock, Users, ArrowLeft, Swords, Medal } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function TournamentDetails() {
    const { tournamentId } = useParams<{ tournamentId: string }>();
    const navigate = useNavigate();
    const { data: tournament, isLoading } = useTournament(tournamentId || "");
    const { user } = useUser();
    const reportMatch = useReportMatch();
    const { toast } = useToast();

    const [activeMatch, setActiveMatch] = useState<any>(null);
    const [scoreA, setScoreA] = useState("");
    const [scoreB, setScoreB] = useState("");
    const [winnerId, setWinnerId] = useState("");

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!tournament) {
        return (
            <Page title="Not Found">
                <div className="text-center">
                    <p>Tournament not found.</p>
                    <PrimaryButton variant="secondary" onClick={() => navigate("/app/tournaments")} className="mt-4">
                        Go Back
                    </PrimaryButton>
                </div>
            </Page>
        );
    }

    const isHost = tournament.host_id === user?.id;
    const isEnded = tournament.status === "ended";

    const handleOpenReport = (match: any) => {
        setActiveMatch(match);
        setScoreA("");
        setScoreB("");
        setWinnerId("");
    };

    const handleReportMatch = () => {
        if (!activeMatch || !winnerId) return;

        reportMatch.mutate(
            {
                tournamentId: tournament.id,
                matchId: activeMatch.id,
                winnerUserId: winnerId,
                scoreA: parseInt(scoreA) || 0,
                scoreB: parseInt(scoreB) || 0,
            },
            {
                onSuccess: () => {
                    setActiveMatch(null);
                    toast({ title: "Match reported successfully" });
                },
            }
        );
    };

    const participants = tournament.participants || [];
    const matches = tournament.matches || [];

    // Group matches by round for display
    const rounds = matches.reduce((acc: any, match: any) => {
        const r = match.round_number; // Use round_number not round_index/round
        if (!acc[r]) acc[r] = [];
        acc[r].push(match);
        return acc;
    }, {});

    const roundKeys = Object.keys(rounds).sort((a, b) => Number(a) - Number(b));

    return (
        <Page
            title={tournament.title}
            subtitle={tournament.games_catalog?.name}
        >
            {isEnded && <Confetti />}
            <div className="mb-6">
                <PrimaryButton variant="ghost" size="sm" onClick={() => navigate("/app/tournaments")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Tournaments
                </PrimaryButton>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content: Brackets or Standings */}
                <div className="lg:col-span-2 space-y-6">
                    {tournament.format === "round_robin" && (
                        <CardShell variant="default" padding="lg">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">Standings</h3>
                                <Chip variant="lavender" size="sm">Round Robin</Chip>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="py-2 pl-2">Player</th>
                                            <th className="py-2 text-center">W</th>
                                            <th className="py-2 text-center">L</th>
                                            <th className="py-2 text-center">Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {participants.map((p: any) => (
                                            <tr key={p.user_id} className="border-b last:border-0 hover:bg-muted/50">
                                                <td className="py-3 pl-2 font-medium">
                                                    {p.profile?.display_name || p.profile?.username}
                                                </td>
                                                {/* Note: logic to calculate W/L/Pts would normally be computed on server or via `tournament_participants` scores/wins fields if easy.
                               For now, we'll placeholder 0s if fields aren't populated by edge function yet.
                           */}
                                                <td className="py-3 text-center">{p.wins || 0}</td>
                                                <td className="py-3 text-center">{p.losses || 0}</td>
                                                <td className="py-3 text-center font-bold">{p.points || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardShell>
                    )}

                    <div className="space-y-6">
                        {roundKeys.map((round) => (
                            <div key={round}>
                                <h3 className="text-md font-semibold text-muted-foreground mb-3">Round {Number(round)}</h3>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {rounds[round].map((match: any) => {
                                        const p1 = participants.find((p: any) => p.user_id === match.player_a_id);
                                        const p2 = participants.find((p: any) => p.user_id === match.player_b_id);
                                        const isPending = match.status === "pending";
                                        const isCompleted = match.status === "completed";

                                        return (
                                            <CardShell key={match.id} variant="default" padding="md" className={`border ${isCompleted ? 'border-border' : 'border-primary/20'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-muted-foreground">Match {match.match_number}</span>
                                                    {isCompleted ? (
                                                        <Chip variant="success" size="sm">Done</Chip>
                                                    ) : (
                                                        isHost ? (
                                                            <PrimaryButton size="sm" variant="ghost" onClick={() => handleOpenReport(match)}>
                                                                <Swords className="h-4 w-4 text-primary" />
                                                            </PrimaryButton>
                                                        ) : <Chip variant="default" size="sm">Vs</Chip>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <div className={`flex justify-between ${match.winner_id === match.player_a_id ? 'font-bold text-success' : ''}`}>
                                                        <span>{p1?.profile?.display_name || "TBD"}</span>
                                                        <span>{match.score_a}</span>
                                                    </div>
                                                    <div className={`flex justify-between ${match.winner_id === match.player_b_id ? 'font-bold text-success' : ''}`}>
                                                        <span>{p2?.profile?.display_name || "TBD"}</span>
                                                        <span>{match.score_b}</span>
                                                    </div>
                                                </div>
                                            </CardShell>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <CardShell variant="default" padding="lg">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Tournament Info</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> Status</span>
                                <Chip variant={isEnded ? "default" : "peach"} size="sm">{isEnded ? "Ended" : "Active"}</Chip>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" /> Players</span>
                                <span className="font-medium">{participants.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-2"><Medal className="h-4 w-4" /> Format</span>
                                <span className="font-medium capitalize">{tournament.format.replace('_', ' ')}</span>
                            </div>
                        </div>
                    </CardShell>

                    {isEnded && (
                        <CardShell variant="peach" padding="lg" className="text-center">
                            <Trophy className="h-12 w-12 text-pastel-peach-dark mx-auto mb-2" />
                            <h3 className="font-bold text-lg">Champion</h3>
                            <p className="text-xl mt-1 text-foreground">
                                {/* Simplified winner display logic */}
                                {participants.sort((a: any, b: any) => (b.points || 0) - (a.points || 0))[0]?.profile?.display_name || "Winner"}
                            </p>
                        </CardShell>
                    )}
                </div>
            </div>

            {/* Report Match Dialog */}
            <Dialog open={!!activeMatch} onOpenChange={(open) => !open && setActiveMatch(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Report Match Result</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Score (P1)</Label>
                                <Input type="number" value={scoreA} onChange={(e) => setScoreA(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Score (P2)</Label>
                                <Input type="number" value={scoreB} onChange={(e) => setScoreB(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Winner</Label>
                            <Select value={winnerId} onValueChange={setWinnerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select winner" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeMatch && participants
                                        .filter((p: any) => p.user_id === activeMatch.player_a_id || p.user_id === activeMatch.player_b_id)
                                        .map((p: any) => (
                                            <SelectItem key={p.user_id} value={p.user_id}>
                                                {p.profile?.display_name || p.profile?.username}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <PrimaryButton onClick={handleReportMatch} disabled={!winnerId || reportMatch.isPending}>
                            {reportMatch.isPending ? "Saving..." : "Save Result"}
                        </PrimaryButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Page>
    );
}
