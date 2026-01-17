import { useParams, useNavigate } from "react-router-dom";
import { Page } from "@/components/layout/Page";
import { CardShell } from "@/components/ui/CardShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { useGameNight, useUpdateScore, useEndGameNight } from "@/lib/query/hooks/useGameNights";
import { useUser } from "@/lib/query/hooks/useSession";
import { Loader2, Trophy, Clock, Users, ArrowLeft, Save, Flag, BookOpen, Sparkles, ExternalLink, Search } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { rulesApi } from "@/lib/api/edge-functions";
import { Textarea } from "@/components/ui/textarea";

export default function NightDetails() {
    const { nightId } = useParams<{ nightId: string }>();
    const navigate = useNavigate();
    const { data: night, isLoading } = useGameNight(nightId || "");
    const { user } = useUser();
    const updateScore = useUpdateScore();
    const endNight = useEndGameNight();
    const { toast } = useToast();

    const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
    const [selectedWinner, setSelectedWinner] = useState<string>("");

    const [rulesOpen, setRulesOpen] = useState(false);
    const [rulesQuestion, setRulesQuestion] = useState("");
    const rulesSearch = useMutation({
        mutationFn: async () => {
            if (!night?.game_id || !rulesQuestion) return;
            return rulesApi.search(night.game_id, rulesQuestion);
        }
    });

    const handleAskRules = () => {
        if (!rulesQuestion.trim()) return;
        rulesSearch.mutate();
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!night) {
        return (
            <Page title="Not Found">
                <div className="text-center">
                    <p>Game night not found.</p>
                    <PrimaryButton variant="secondary" onClick={() => navigate("/app/nights")} className="mt-4">
                        Go Back
                    </PrimaryButton>
                </div>
            </Page>
        );
    }

    const isHost = night.host_id === user?.id;
    const isEnded = !!night.ended_at;

    const handleScoreChange = (participantId: string, value: string) => {
        setScoreInputs((prev) => ({ ...prev, [participantId]: value }));
    };

    const handleScoreUpdate = (participantId: string) => {
        const score = parseInt(scoreInputs[participantId]);
        if (isNaN(score)) return;

        // Use current round or default to 1 if not set (assuming 1 round for now as per schema simplification for MVP)
        // The M4 requirements mention "rounds selector + add round", but for MVP we might stick to single aggregated score
        // or assume we are editing the "current" score.
        // The `game_night_update_score` edge function signature was: { nightId, userId, roundIndex, score }
        // Let's assume roundIndex 0 for now.

        updateScore.mutate(
            { nightId: night.id, userId: participantId, roundIndex: 0, score },
            {
                onSuccess: () => {
                    setScoreInputs((prev) => {
                        const newInputs = { ...prev };
                        delete newInputs[participantId];
                        return newInputs;
                    });
                },
            }
        );
    };

    const handleEndNight = () => {
        if (!selectedWinner) {
            toast({ title: "Please select a winner", variant: "destructive" });
            return;
        }
        endNight.mutate(
            { nightId: night.id, winnerUserId: selectedWinner },
            {
                onSuccess: () => {
                    // Ideally show recap modal
                },
            }
        );
    };

    // Safe access to scores
    const getScore = (participantId: string) => {
        // Assuming flat structure or single round for basic view
        // If night.scores is complex, we'd traverse it.
        // For now, let's look for a simple score mapping or array in the `night` object if it returns it joined.
        // If the hook returns strict db schema, `night_scores` might be a joined array.
        const pScore = night.scores?.find((s: any) => s.user_id === participantId && s.round_index === 0);
        return pScore?.score || 0;
    };

    return (
        <Page
            title={night.title}
            subtitle={night.game?.name}
            actions={
                !isEnded && isHost ? (
                    <Dialog>
                        <DialogTrigger asChild>
                            <PrimaryButton variant="secondary" size="sm">
                                <Flag className="mr-2 h-4 w-4" />
                                End Night
                            </PrimaryButton>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>End Game Night</DialogTitle>
                                <DialogDescription>
                                    Choose the winner to finalize the results and update ELO ratings. This cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Label>Winner</Label>
                                <Select value={selectedWinner} onValueChange={setSelectedWinner}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select winner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {night.participants?.map((p: any) => (
                                            <SelectItem key={p.user_id} value={p.user_id}>
                                                {p.profile?.display_name || p.profile?.username}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <PrimaryButton onClick={handleEndNight} disabled={endNight.isPending || !selectedWinner}>
                                    {endNight.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirm & End
                                </PrimaryButton>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                ) : (
                    isEnded ? <Chip variant="outline">Ended</Chip> : null
                )
            }
        >
            <div className="mb-6">
                <PrimaryButton variant="ghost" size="sm" onClick={() => navigate("/app/nights")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Nights
                </PrimaryButton>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Scoreboard */}
                <div className="lg:col-span-2 space-y-6">
                    <CardShell variant="default" padding="lg">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-foreground">Scoreboard</h3>
                            {!isEnded && <Chip variant="success" size="sm">Live</Chip>}
                        </div>

                        <div className="space-y-4">
                            {night.participants?.map((participant: any) => {
                                const score = getScore(participant.user_id);
                                const userInput = scoreInputs[participant.user_id];
                                const isDirty = userInput !== undefined && userInput !== String(score);
                                const canEdit = isHost || participant.user_id === user?.id;

                                return (
                                    <div key={participant.user_id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {(participant.profile?.username?.[0] || "?").toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">
                                                    {participant.profile?.display_name || participant.profile?.username}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {night.host_id === participant.user_id ? "Host" : "Player"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isEnded ? (
                                                <span className="text-2xl font-bold tabular-nums">{score}</span>
                                            ) : (
                                                <>
                                                    <Input
                                                        type="number"
                                                        className="w-20 text-right tabular-nums font-bold text-lg"
                                                        value={userInput !== undefined ? userInput : score}
                                                        onChange={(e) => handleScoreChange(participant.user_id, e.target.value)}
                                                        disabled={!canEdit}
                                                    />
                                                    {isDirty && (
                                                        <PrimaryButton
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleScoreUpdate(participant.user_id)}
                                                            disabled={updateScore.isPending}
                                                        >
                                                            <Save className="h-4 w-4 text-primary" />
                                                        </PrimaryButton>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardShell>

                    {isEnded && night.winner_id && (
                        <CardShell variant="mint" padding="lg">
                            <div className="text-center">
                                <Trophy className="h-12 w-12 text-pastel-mint-dark mx-auto mb-2" />
                                <h2 className="text-2xl font-bold text-foreground">
                                    Winner: {night.participants?.find((p: any) => p.user_id === night.winner_id)?.profile?.display_name || "Unknown"}
                                </h2>
                                <p className="text-muted-foreground mt-2">
                                    Game Night Completed on {format(new Date(night.ended_at!), "MMM d, yyyy")}
                                </p>
                            </div>
                        </CardShell>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-1 space-y-6 flex flex-col">
                    <CardShell variant="default" padding="lg">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Details</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> Started</span>
                                <span className="font-medium">{format(new Date(night.created_at), "h:mm a")}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" /> Players</span>
                                <span className="font-medium">{night.participants?.length || 0}</span>
                            </div>

                            {/* Inline Rules Button */}
                            <div className="pt-4 border-t">
                                <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
                                    <DialogTrigger asChild>
                                        <PrimaryButton variant="accent" className="w-full">
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Ask Rules AI
                                        </PrimaryButton>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[500px]">
                                        <DialogHeader>
                                            <DialogTitle>Rules Assistant</DialogTitle>
                                            <DialogDescription>
                                                Ask a question about {night.game?.name || "the game"}.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4 space-y-4">
                                            <Textarea
                                                placeholder="e.g. How many points constitutes a win?"
                                                value={rulesQuestion}
                                                onChange={(e) => setRulesQuestion(e.target.value)}
                                                className="min-h-[100px]"
                                            />
                                            {rulesSearch.data && (
                                                <div className="bg-secondary/20 p-4 rounded-lg space-y-2">
                                                    <p className="font-medium text-sm">Answer:</p>
                                                    <p className="text-sm text-foreground">{rulesSearch.data.answer}</p>
                                                    {rulesSearch.data.citations?.length > 0 && (
                                                        <div className="pt-2 mt-2 border-t border-border/50">
                                                            <p className="text-xs text-muted-foreground mb-1">Source:</p>
                                                            <a href={rulesSearch.data.citations[0].url} target="_blank" rel="noopener" className="text-xs text-primary flex items-center gap-1 hover:underline">
                                                                {rulesSearch.data.citations[0].title} <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <PrimaryButton onClick={handleAskRules} disabled={rulesSearch.isPending || !rulesQuestion}>
                                                {rulesSearch.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                                Ask Question
                                            </PrimaryButton>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* Join Code Display */}
                            {!isEnded && (
                                <div className="pt-4 border-t">
                                    <p className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-wider">Join Code</p>
                                    <div className="bg-secondary p-3 rounded-lg text-center">
                                        <span className="text-2xl font-mono font-bold tracking-widest text-primary">
                                            {night.join_code}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardShell>
                </div>
            </div>
        </Page>
    );
}
