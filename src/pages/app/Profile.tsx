import { useState, useEffect } from "react";
import { Page } from "@/components/layout/Page";
import { CardShell } from "@/components/ui/CardShell";
import { StatCard } from "@/components/ui/StatCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useProfile, useUpdateProfile } from "@/lib/query/hooks/useProfile";
import { useStats } from "@/lib/query/hooks/useStats";
import { useFriends, useFriendRequests, useSendFriendRequest, useRespondToFriendRequest } from "@/lib/query/hooks/useFriends";
import { useUser } from "@/lib/query/hooks/useSession";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, Trophy, Calendar, Users, Edit2, Check, X, Loader2 } from "lucide-react";
import { Chip } from "@/components/ui/chip";

export default function Profile() {
  const { user } = useUser();
  const { data: profile, isLoading } = useProfile();
  const { data: stats } = useStats();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState(profile?.username || "");

  // Sync form fields when profile data changes
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setUsername(profile.username || "");
    }
    // We intentionally omit displayName/username from deps to avoid overwriting user edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName || null,
        username: username,
      });
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const initials = (profile?.display_name || profile?.username || user?.email || "U")
    .substring(0, 2)
    .toUpperCase();

  if (isLoading) {
    return (
      <Page title="Loading Profile">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Page>
    );
  }

  return (
    <Page title="My Profile">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <CardShell variant="default" padding="lg">
            <div className="text-center">
              <Avatar className="h-20 w-20 mx-auto mb-4">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-foreground">
                {profile?.display_name || profile?.username || "User"}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">@{profile?.username}</p>

              {!isEditing && (
                <PrimaryButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="mr-2 h-3 w-3" />
                  Edit Profile
                </PrimaryButton>
              )}
            </div>
          </CardShell>

          {/* Edit Form */}
          {isEditing && (
            <CardShell variant="default" padding="lg">
              <h3 className="text-lg font-semibold text-foreground mb-4">Edit Profile</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your_username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Name"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <PrimaryButton
                    onClick={handleSave}
                    disabled={updateProfile.isPending}
                    size="sm"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    {updateProfile.isPending ? "Saving..." : "Save"}
                  </PrimaryButton>
                  <PrimaryButton
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                    disabled={updateProfile.isPending}
                    size="sm"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Cancel
                  </PrimaryButton>
                </div>
              </div>
            </CardShell>
          )}
        </div>

        {/* Right Column - Stats & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              value={stats?.gamesPlayed?.toString() || "0"}
              label="Games Played"
              variant="mint"
              icon={<User className="h-5 w-5 text-pastel-mint-dark" />}
            />
            <StatCard
              value={stats?.wins?.toString() || "0"}
              label="Wins"
              variant="lavender"
              icon={<Trophy className="h-5 w-5 text-pastel-lavender-dark" />}
            />
            <StatCard
              value={stats?.activeNights?.toString() || "0"}
              label="Active Nights"
              variant="sky"
              icon={<Calendar className="h-5 w-5 text-pastel-sky-dark" />}
            />
            <StatCard
              value={stats?.friendsCount?.toString() || "0"}
              label="Friends"
              variant="peach"
              icon={<Users className="h-5 w-5 text-pastel-peach-dark" />}
            />
          </div>

          {/* Friends Management */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Tabs defaultValue="friends" className="w-full">
              <div className="border-b px-6 py-3 bg-secondary/20">
                <TabsList className="bg-transparent p-0 gap-6 h-auto">
                  <TabsTrigger value="friends" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 font-medium">
                    Friends
                  </TabsTrigger>
                  <TabsTrigger value="requests" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 font-medium relative">
                    Requests
                    {/* Dot indicator if requests exist could go here */}
                  </TabsTrigger>
                  <TabsTrigger value="add" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 font-medium">
                    Add Friend
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="friends" className="m-0 focus-visible:ring-0">
                  <FriendsList />
                </TabsContent>

                <TabsContent value="requests" className="m-0 focus-visible:ring-0">
                  <FriendRequestsList />
                </TabsContent>

                <TabsContent value="add" className="m-0 focus-visible:ring-0">
                  <AddFriendForm />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </Page>
  );
}

function FriendsList() {
  const { data: friends, isLoading } = useFriends();

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />;

  if (!friends || friends.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
        <p>No friends yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {friends.map((friend) => (
        <div key={friend.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors">
          <Avatar>
            <AvatarFallback>{(friend.profile?.username?.[0] || "?").toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{friend.profile?.display_name || friend.profile?.username}</p>
            <p className="text-xs text-muted-foreground">@{friend.profile?.username}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FriendRequestsList() {
  const { data: requests, isLoading } = useFriendRequests();
  const respond = useRespondToFriendRequest();

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />;

  const incoming = requests?.incoming || [];
  const outgoing = requests?.outgoing || [];

  if (incoming.length === 0 && outgoing.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No pending requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {incoming.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Incoming</h4>
          {incoming.map((req) => (
            <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/10">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{(req.profile?.username?.[0] || "?").toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{req.profile?.username}</span>
              </div>
              <div className="flex gap-2">
                <PrimaryButton
                  size="sm"
                  variant="ghost"
                  onClick={() => respond.mutate({ requestId: req.id, action: "accept" })}
                  disabled={respond.isPending}
                >
                  <Check className="h-4 w-4 text-green-600" />
                </PrimaryButton>
                <PrimaryButton
                  size="sm"
                  variant="ghost"
                  onClick={() => respond.mutate({ requestId: req.id, action: "decline" })}
                  disabled={respond.isPending}
                >
                  <X className="h-4 w-4 text-red-600" />
                </PrimaryButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Outgoing</h4>
          {outgoing.map((req) => (
            <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/10">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{(req.profile?.username?.[0] || "?").toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-muted-foreground">{req.profile?.username}</span>
              </div>
              <Chip variant="default" size="sm">Pending</Chip>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddFriendForm() {
  const [identifier, setIdentifier] = useState("");
  const sendRequest = useSendFriendRequest();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    sendRequest.mutate(identifier, {
      onSuccess: () => setIdentifier("")
    });
  };

  return (
    <div className="max-w-sm">
      <h4 className="font-medium mb-3">Send Friend Request</h4>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Enter identifier (number or email)"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <PrimaryButton type="submit" disabled={sendRequest.isPending}>
          {sendRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
        </PrimaryButton>
      </form>
      <p className="text-xs text-muted-foreground mt-2">
        Ask your friend for their unique identifier found in their database profile or use their email.
      </p>
    </div>
  );
}
