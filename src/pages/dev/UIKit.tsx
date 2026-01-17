import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardShell } from "@/components/ui/CardShell";
import { StatCard } from "@/components/ui/StatCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Chip } from "@/components/ui/chip";
import { BookOpen, Calendar, Trophy, Users, Search, Star, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function UIKit() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <h1 className="text-page-title">UI Kit Preview</h1>
          <p className="mt-2 text-muted-foreground">
            Developer-only page to verify design system matches reference screenshots.
          </p>
        </div>

        {/* Typography */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Typography</h2>
          <CardShell variant="default" padding="lg" className="space-y-4">
            <h1 className="text-hero">
              Hero Headline Text
            </h1>
            <h2 className="text-section">
              Section Header Text
            </h2>
            <h3 className="text-card-title">
              Card Title Text
            </h3>
            <p className="text-body">
              Body text - Regular paragraph text used throughout the application for 
              content and descriptions.
            </p>
            <p className="text-muted-body">
              Muted body text - Used for secondary information, hints, and metadata.
            </p>
          </CardShell>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Buttons</h2>
          <CardShell variant="default" padding="lg">
            <div className="flex flex-wrap gap-4 items-center">
              <PrimaryButton>Primary Button</PrimaryButton>
              <PrimaryButton variant="secondary">Secondary Button</PrimaryButton>
              <PrimaryButton variant="ghost">Ghost Button</PrimaryButton>
              <PrimaryButton variant="accent">Accent Button</PrimaryButton>
            </div>
            <div className="flex flex-wrap gap-4 items-center mt-4">
              <PrimaryButton size="sm">Small</PrimaryButton>
              <PrimaryButton size="md">Medium</PrimaryButton>
              <PrimaryButton size="lg">Large</PrimaryButton>
            </div>
          </CardShell>
        </section>

        {/* Cards */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Card Variants</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <CardShell variant="default" hover>
              <BookOpen className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-card-title mb-2">Default Card</h3>
              <p className="text-sm text-muted-foreground">White background with soft shadow.</p>
            </CardShell>
            <CardShell variant="mint" hover>
              <Calendar className="h-8 w-8 text-pastel-mint-dark mb-4" />
              <h3 className="text-card-title mb-2">Mint Card</h3>
              <p className="text-sm text-muted-foreground">Pastel green background.</p>
            </CardShell>
            <CardShell variant="sky" hover>
              <Trophy className="h-8 w-8 text-pastel-sky-dark mb-4" />
              <h3 className="text-card-title mb-2">Sky Card</h3>
              <p className="text-sm text-muted-foreground">Pastel blue background.</p>
            </CardShell>
            <CardShell variant="lavender" hover>
              <Users className="h-8 w-8 text-pastel-lavender-dark mb-4" />
              <h3 className="text-card-title mb-2">Lavender Card</h3>
              <p className="text-sm text-muted-foreground">Pastel yellow background.</p>
            </CardShell>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <CardShell variant="peach" hover>
              <Star className="h-8 w-8 text-pastel-peach-dark mb-4" />
              <h3 className="text-card-title mb-2">Peach Card</h3>
              <p className="text-sm text-muted-foreground">Pastel peach/orange background.</p>
            </CardShell>
            <CardShell variant="accent">
              <Clock className="h-8 w-8 text-accent-foreground mb-4" />
              <h3 className="text-card-title text-accent-foreground mb-2">Accent Card</h3>
              <p className="text-sm text-accent-foreground/80">Orange accent background.</p>
            </CardShell>
          </div>
        </section>

        {/* Stat Cards */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Stat Cards</h2>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard value="42%" label="Win Rate" variant="mint" />
            <StatCard value="60K" label="Points Earned" variant="sky" />
            <StatCard value="5x" label="Tournament Wins" variant="lavender" />
            <StatCard value="80%" label="Completion Rate" variant="peach" />
          </div>
        </section>

        {/* Form Inputs */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Form Inputs</h2>
          <CardShell variant="default" padding="lg">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="text-input">Text Input</Label>
                <Input id="text-input" placeholder="Enter text..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-input">Search Input</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="search-input" placeholder="Search..." className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Select</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                    <SelectItem value="option2">Option 2</SelectItem>
                    <SelectItem value="option3">Option 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardShell>
        </section>

        {/* Chips/Badges */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Chips / Badges</h2>
          <CardShell variant="default" padding="lg">
            <div className="flex flex-wrap gap-3">
              <Chip>Default</Chip>
              <Chip variant="primary">Primary</Chip>
              <Chip variant="accent">Accent</Chip>
              <Chip variant="success">Success</Chip>
              <Chip variant="warning">Warning</Chip>
              <Chip variant="danger">Danger</Chip>
              <Chip variant="outline">Outline</Chip>
              <Chip variant="mint">Mint</Chip>
              <Chip variant="sky">Sky</Chip>
              <Chip variant="lavender">Lavender</Chip>
              <Chip variant="peach">Peach</Chip>
            </div>
          </CardShell>
        </section>

        {/* Table */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Table</h2>
          <CardShell variant="default" padding="none" className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Games</TableHead>
                  <TableHead>Wins</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">1</TableCell>
                  <TableCell>Alice Johnson</TableCell>
                  <TableCell>24</TableCell>
                  <TableCell>18</TableCell>
                  <TableCell className="text-right">
                    <Chip variant="success" size="sm">75%</Chip>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">2</TableCell>
                  <TableCell>Bob Smith</TableCell>
                  <TableCell>20</TableCell>
                  <TableCell>14</TableCell>
                  <TableCell className="text-right">
                    <Chip variant="success" size="sm">70%</Chip>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">3</TableCell>
                  <TableCell>Carol Davis</TableCell>
                  <TableCell>18</TableCell>
                  <TableCell>9</TableCell>
                  <TableCell className="text-right">
                    <Chip variant="warning" size="sm">50%</Chip>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardShell>
        </section>

        {/* Shadows */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Shadows</h2>
          <div className="grid gap-6 sm:grid-cols-4">
            <div className="bg-card rounded-xl p-6 shadow-soft-sm">
              <p className="text-sm font-medium">soft-sm</p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-soft-md">
              <p className="text-sm font-medium">soft-md</p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-soft-lg">
              <p className="text-sm font-medium">soft-lg</p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-card">
              <p className="text-sm font-medium">card</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
