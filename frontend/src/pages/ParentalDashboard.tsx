import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ParentalService,
  ParentalControls,
  ActivityStats,
} from "@/services/parental-service";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { FaChild, FaClock, FaShieldAlt, FaBan, FaSchool } from "react-icons/fa";
import { Shield, UserPlus } from "lucide-react"; // Assuming these are from lucide-react
import { Badge } from "@/components/ui/badge"; // Assuming Badge is a shadcn/ui component
import { toast as sonnerToast } from "sonner"; // Renamed to avoid conflict with useToast

const ParentalDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [linkedChild, setLinkedChild] = useState<Partial<User> | null>(null);
  const [linkInput, setLinkInput] = useState("");

  // Dashboard State
  const [controls, setControls] = useState<ParentalControls>({
    dailyKarmaLimit: 100,
    curfewStart: "21:00",
    curfewEnd: "07:00",
    schoolMode: false,
  });

  const [stats, setStats] = useState<ActivityStats | null>(null);

  // Load mock data on mount if child is "linked" (simulated persistence)
  useEffect(() => {
    // Simulate loading a linked child from local storage or a previous session
    const storedChild = localStorage.getItem("linkedChild");
    if (storedChild) {
      const child = JSON.parse(storedChild);
      setLinkedChild(child);
      loadChildData(child.id);
    }
  }, []);

  const loadChildData = async (childId: string) => {
    setLoading(true);
    try {
      const [fetchedControls, fetchedStats] = await Promise.all([
        ParentalService.getControls(childId),
        ParentalService.getChildActivity(childId),
      ]);
      setControls(fetchedControls);
      setStats(fetchedStats);
    } catch (e) {
      console.error("Failed to load child data", e);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les données de l'enfant.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkChild = async () => {
    if (!linkInput) return;
    setLoading(true);
    try {
      const child = await ParentalService.linkChild(linkInput);
      setLinkedChild(child);
      localStorage.setItem("linkedChild", JSON.stringify(child)); // Simulate persistence
      loadChildData(child.id);
      toast({
        title: "Enfant lié avec succès!",
        description: `Le compte de ${child.username} est maintenant sous supervision.`,
      });
    } catch (e: any) {
      toast({
        title: "Erreur",
        description:
          e.message ||
          "Impossible de lier l'enfant. Vérifiez le nom d'utilisateur.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveControls = async () => {
    if (!linkedChild?.id) {
      toast({
        title: "Erreur",
        description: "Aucun enfant lié pour sauvegarder les contrôles.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await ParentalService.updateControls(linkedChild.id, controls);
      toast({
        title: "Paramètres sauvegardés",
        description: "Les limites ont été mises à jour.",
      });
    } catch (e) {
      console.error("Failed to save controls", e);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder les contrôles.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDailyLimitChange = (value: number[]) => {
    setControls((prev) => ({ ...prev, dailyKarmaLimit: value[0] }));
  };

  const handleCurfewToggle = (checked: boolean) => {
    // For simplicity, we'll just toggle the concept of curfew being active
    // In a real app, this might enable/disable the curfewStart/End fields
    setControls((prev) => ({
      ...prev,
      curfewStart: checked ? "21:00" : "",
      curfewEnd: checked ? "07:00" : "",
    }));
  };

  const handleSchoolModeToggle = (checked: boolean) => {
    setControls((prev) => ({ ...prev, schoolMode: checked }));
  };

  return (
    <div className="min-h-screen bg-black text-yellow-500 p-4 pb-24 font-mono">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
            <FaShieldAlt className="text-purple-500" />
            {linkedChild
              ? `Supervision: ${linkedChild.username}`
              : "QG Parental"}
          </h1>
          <p className="text-gray-400 mt-1">
            Gérez le bien-être numérique de votre ruche.
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-yellow-400 border-yellow-400 gap-2 self-start md:self-center px-3 py-1"
        >
          <Shield className="w-4 h-4" />
          MODE SIMULATION (MOCK)
        </Badge>
      </motion.div>

      {!linkedChild ? (
        /* EMPTY STATE - LINK CHILD */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center mt-12"
        >
          <Card className="bg-zinc-900/80 border-purple-500/30 backdrop-blur-md p-8 text-center max-w-lg w-full">
            <div className="flex flex-col items-center space-y-6">
              <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center ring-1 ring-purple-500/30">
                <UserPlus className="w-12 h-12 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Lier un compte enfant
                </h2>
                <p className="text-gray-400">
                  Entrez le nom d'utilisateur ou le courriel de votre enfant
                  pour activer la supervision parentale.
                </p>
              </div>

              <div className="flex gap-2 w-full">
                <Input
                  placeholder="Ex: Kevin_Junior"
                  className="bg-black/50 border-white/10 text-white"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLinkChild()}
                />
                <Button
                  onClick={handleLinkChild}
                  className="bg-purple-600 hover:bg-purple-700 min-w-[100px]"
                  disabled={loading}
                >
                  {loading ? "..." : "Lier"}
                </Button>
              </div>
              <p className="text-xs text-gray-600">
                * En mode simulation, essayez n'importe quel nom.
              </p>
            </div>
          </Card>
        </motion.div>
      ) : (
        /* DASHBOARD CONTENT */
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-zinc-900 border border-yellow-500/20 w-fit">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
            >
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger
              value="controls"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
            >
              Contrôles
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stats Cards */}
              <Card className="bg-zinc-900 border-yellow-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Karma Gagné
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">
                    {stats?.karmaEarned || 0} pts
                  </div>
                  <p className="text-xs text-gray-500">Cette semaine</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-yellow-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Temps d'écran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-400">
                    {stats?.screenTimeMinutes || 0} min
                  </div>
                  <p className="text-xs text-gray-500">Aujourd'hui</p>
                </CardContent>
              </Card>

              {/* Activity Chart */}
              <Card className="bg-zinc-900 border-yellow-500/20 col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FaClock className="text-yellow-500" /> Activité
                    Hebdomadaire
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { day: "Lun", minutes: 45 },
                          { day: "Mar", minutes: 60 },
                          { day: "Mer", minutes: 120 },
                          { day: "Jeu", minutes: 90 },
                          { day: "Ven", minutes: 30 },
                          { day: "Sam", minutes: 180 },
                          {
                            day: "Dim",
                            minutes: stats?.screenTimeMinutes || 0,
                          },
                        ]}
                      >
                        <XAxis
                          dataKey="day"
                          stroke="#71717a"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#71717a"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            borderColor: "#3f3f46",
                            borderRadius: "8px",
                          }}
                          itemStyle={{ color: "#eab308" }}
                        />
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#27272a"
                          vertical={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="minutes"
                          stroke="#eab308"
                          strokeWidth={2}
                          dot={{ fill: "#eab308" }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CONTROLS TAB */}
          <TabsContent value="controls" className="space-y-6">
            <Card className="bg-zinc-900 border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FaBan className="text-red-500" /> Limites & Restrictions
                </CardTitle>
                <CardDescription>
                  Configurez les règles d'utilisation pour{" "}
                  {linkedChild.username}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Daily Karma Limit */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base text-gray-200">
                      Limite de Karma Quotidienne
                    </Label>
                    <span className="text-yellow-500 font-mono font-bold text-lg">
                      {controls.dailyKarmaLimit} pts
                    </span>
                  </div>
                  <Slider
                    defaultValue={[controls.dailyKarmaLimit]}
                    max={500}
                    step={10}
                    value={[controls.dailyKarmaLimit]}
                    onValueChange={handleDailyLimitChange}
                    className="py-2"
                  />
                  <p className="text-xs text-gray-500">
                    Limite le montant de Karma que l'enfant peut dépenser par
                    jour.
                  </p>
                </div>

                <div className="h-px bg-white/10" />

                {/* Curfew Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base text-gray-200 flex items-center gap-2">
                      <FaBan className="text-red-400" /> Couvre-feu (21h - 7h)
                    </Label>
                    <p className="text-sm text-gray-500">
                      Bloque l'accès aux jeux et aux réseaux sociaux la nuit.
                    </p>
                  </div>
                  <Switch
                    checked={!!controls.curfewStart}
                    onCheckedChange={handleCurfewToggle}
                  />
                </div>

                <div className="h-px bg-white/10" />

                {/* School Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base text-gray-200 flex items-center gap-2">
                      <FaSchool className="text-blue-400" /> Mode École
                    </Label>
                    <p className="text-sm text-gray-500">
                      Silencie les notifications durant les heures de classe.
                    </p>
                  </div>
                  <Switch
                    checked={controls.schoolMode}
                    onCheckedChange={handleSchoolModeToggle}
                  />
                </div>

                <Button
                  onClick={handleSaveControls}
                  className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-bold mt-4"
                  disabled={loading}
                >
                  {loading ? "Sauvegarde..." : "Appliquer les paramètres"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ParentalDashboard;
