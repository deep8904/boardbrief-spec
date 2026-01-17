import { useState } from "react";
import { Page } from "@/components/layout/Page";
import { CardShell } from "@/components/ui/CardShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Chip } from "@/components/ui/chip";
import { useGames } from "@/lib/query/hooks/useGames";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rulesApi, type RulesSearchResult } from "@/lib/api/edge-functions";
import { Loader2, Search, BookOpen, ExternalLink, Sparkles, MessageSquare, Save, Trash2, Pin, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRuleCards, useCreateRuleCard, useDeleteRuleCard, useTogglePinRuleCard } from "@/lib/query/hooks/useRules";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Rules() {
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // For filtering games
  const { data: games, isLoading: gamesLoading } = useGames(); // Assuming useGames returns all games or I handle filtering
  const { toast } = useToast();

  // Rule Cards Hooks
  const { data: ruleCards, isLoading: loadingCards } = useRuleCards(selectedGameId || undefined);
  const createCard = useCreateRuleCard();
  const deleteCard = useDeleteRuleCard();
  const togglePin = useTogglePinRuleCard();

  // Dialog State
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardContent, setNewCardContent] = useState("");

  const searchMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGameId || !question) throw new Error("Please select a game and ask a question");
      return rulesApi.search(selectedGameId, question);
    },
    onError: (error) => {
      toast({
        title: "Error details",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGameId) {
      toast({ title: "Select a game first", variant: "destructive" });
      return;
    }
    if (!question.trim()) {
      toast({ title: "Enter a question", variant: "destructive" });
      return;
    }
    searchMutation.mutate();
  };

  const openSaveDialog = () => {
    if (!searchMutation.data) return;
    setNewCardTitle(question);
    setNewCardContent(searchMutation.data.answer);
    setSaveDialogOpen(true);
  };

  const handleSaveCard = () => {
    if (!selectedGameId) return;
    createCard.mutate({
      title: newCardTitle,
      content: newCardContent,
      gameId: selectedGameId,
      tags: ["ai-generated"],
    }, {
      onSuccess: () => setSaveDialogOpen(false)
    });
  };

  const filteredGames = games?.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];

  return (
    <Page title="Rules Assistant" subtitle="AI-powered rule clarifications">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Search & Input Section */}
        <section className="space-y-6">
          <CardShell variant="default" padding="lg" className="border-primary/20">
            <form onSubmit={handleAsk} className="space-y-6">
              <div className="space-y-2">
                <Label>Which game are you playing?</Label>
                <Select value={selectedGameId} onValueChange={setSelectedGameId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a game..." />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Simple search inside select content might be hard with shadcn Select, so we just list them for MVP or rely on native select behavior if list is short. 
                            If list is long, a ComboBox is better, but for now Select is fine.
                        */}
                    {games?.map((game) => (
                      <SelectItem key={game.id} value={game.id}>
                        {game.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>What's your question?</Label>
                <Textarea
                  placeholder="e.g. Can I build a settlement if I don't have a road connecting to it?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[100px] text-lg resize-none"
                />
              </div>

              <div className="flex justify-end">
                <PrimaryButton type="submit" size="lg" disabled={searchMutation.isPending || !selectedGameId || !question}>
                  {searchMutation.isPending ? (
                    <>
                      <Sparkles className="mr-2 h-5 w-5 animate-spin data-[state=active]:animate-pulse" />
                      Consulting Rulebook...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      Get Answer
                    </>
                  )}
                </PrimaryButton>
              </div>
            </form>
          </CardShell>
        </section>

        {/* Results Section */}
        {searchMutation.data && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardShell variant="mint" padding="lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <Sparkles className="h-6 w-6 text-foreground" />
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Answer</h3>
                    <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
                      <p>{searchMutation.data.answer}</p>
                    </div>
                  </div>

                  {searchMutation.data.citations && searchMutation.data.citations.length > 0 && (
                    <div className="pt-4 border-t border-white/20">
                      <h4 className="text-sm font-semibold uppercase tracking-wider mb-3 opacity-80 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" /> Sources
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {searchMutation.data.citations.map((cite, idx) => (
                          <a
                            key={idx}
                            href={cite.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
                          >
                            <p className="font-medium truncate mb-1 flex items-center gap-2">
                              {cite.title} <ExternalLink className="h-3 w-3 opacity-50" />
                            </p>
                            <p className="text-xs opacity-70 line-clamp-2">{cite.excerpt}</p>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                    <Chip variant="default" size="sm">Confidence: {Math.round(searchMutation.data.confidence * 100)}%</Chip>

                    <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                      <DialogTrigger asChild>
                        <PrimaryButton variant="secondary" size="sm" onClick={openSaveDialog}>
                          <Save className="mr-2 h-4 w-4" />
                          Save as Card
                        </PrimaryButton>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Save Rule Card</DialogTitle>
                          <DialogDescription>Save this Q&A for quick access later.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Title / Question</Label>
                            <Input value={newCardTitle} onChange={(e) => setNewCardTitle(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Content / Answer</Label>
                            <Textarea value={newCardContent} onChange={(e) => setNewCardContent(e.target.value)} className="min-h-[100px]" />
                          </div>
                        </div>
                        <DialogFooter>
                          <PrimaryButton onClick={handleSaveCard} disabled={createCard.isPending}>
                            {createCard.isPending ? "Saving..." : "Save Card"}
                          </PrimaryButton>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardShell>
          </section>
        )}

        {/* Saved Rule Cards Section */}
        {ruleCards && ruleCards.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-mutated-foreground" />
              Saved Rule Cards
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {ruleCards.map((card) => (
                <CardShell key={card.id} variant="default" padding="md" className="relative group">
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => togglePin.mutate({ cardId: card.id, isPinned: !card.is_pinned })} className="p-1 hover:bg-secondary rounded">
                      <Pin className={`h-4 w-4 ${card.is_pinned ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                    </button>
                    <button onClick={() => deleteCard.mutate(card.id)} className="p-1 hover:bg-destructive/10 rounded text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <h4 className="font-semibold pr-16 mb-2 line-clamp-2">{card.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-3">{card.content}</p>
                  {card.is_pinned && <Pin className="absolute top-3 right-3 h-4 w-4 fill-primary text-primary opacity-100" />}
                </CardShell>
              ))}
            </div>
          </section>
        )}
      </div>
    </Page>
  );
}
