import React, { useState, useEffect } from "react";
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
import { toast as sonnerToast } from "sonner";
import {
  linkChild,
  getChildren,
  getParentalControls,
  updateParentalControls,
} from "@/services/api";
import { User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  FaChild,
  FaClock,
  FaShieldAlt,
  FaBan,
  FaSchool,
  FaHive,
} from "react-icons/fa";
import { Shield, UserPlus } from "lucide-react"; // Assuming these are from lucide-react
import { Badge } from "@/components/ui/badge"; // Assuming Badge is a shadcn/ui component

interface ParentalControls {
  dailyKarmaLimit: number;
  curfewStart: string;
  curfewEnd: string;
  schoolMode: boolean;
  homeLat?: number;
  homeLng?: number;
  allowedRadiusMeters?: number;
}

const ParentalDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<User[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [childUsername, setChildUsername] = useState("");

  // Dashboard State
  const [controls, setControls] = useState<ParentalControls>({
    dailyKarmaLimit: 100,
    curfewStart: "21:00",
    curfewEnd: "07:00",
    schoolMode: false,
    homeLat: undefined,
    homeLng: undefined,
    allowedRadiusMeters: 500,
  });

  const [stats, setStats] = useState<any | null>(null); // Keeping stats for now, but it's not loaded by new API

  const selectedChild = children.find((c) => c.id === selectedChildId);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    setLoading(true);
    try {
      const list = await getChildren();
      setChildren(list);
      if (list.length > 0 && !selectedChildId) {
        setSelectedChildId(list[0].id);
      }
    } catch (e) {
      sonnerToast.error("Erreur de chargement des enfants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChildId) {
      loadControls(selectedChildId);
      // No stats API yet, so clear or keep old mock data
      setStats(null);
    }
  }, [selectedChildId]);

  const loadControls = async (childId: string) => {
    setLoading(true);
    try {
      const data = await getParentalControls(childId);
      if (data) {
        setControls({
          dailyKarmaLimit: data.dailyKarmaLimit || 100,
          curfewStart: data.curfewStart || "20:00",
          curfewEnd: data.curfewEnd || "07:00",
          schoolMode: data.schoolMode || false,
          homeLat: data.homeLat ? parseFloat(data.homeLat) : undefined,
          homeLng: data.homeLng ? parseFloat(data.homeLng) : undefined,
          allowedRadiusMeters: data.allowedRadiusMeters || 500,
        });
      }
    } catch (e) {
      sonnerToast.error("Erreur de chargement des réglages");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkChild = async () => {
    if (!childUsername) return;
    setLoading(true);
    try {
      const result = await linkChild(childUsername);
      if (result) {
        sonnerToast.success(`${result.username} est maintenant jumelé! 🐝`);
        setChildUsername("");
        loadChildren();
      } else {
        sonnerToast.error("Oups! On trouve pas ce citoyen-là.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveControls = async () => {
    if (!selectedChildId) {
      sonnerToast.error("Aucun enfant sélectionné.");
      return;
    }
    setLoading(true);
    try {
      const success = await updateParentalControls(selectedChildId, controls);
      if (success) {
        sonnerToast.success("Réglages mis à jour avec succès! 🍯");
      } else {
        sonnerToast.error("Erreur de sauvegarde.");
      }
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

  const handleGeoRadiusChange = (value: number[]) => {
    setControls((prev) => ({ ...prev, allowedRadiusMeters: value[0] }));
  };

  const handleSetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setControls((prev) => ({
          ...prev,
          homeLat: position.coords.latitude,
          homeLng: position.coords.longitude,
        }));
        sonnerToast.success("Position actuelle définie comme 'Maison'");
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(circle_at_20%_20%,_rgba(234,179,8,0.05)_0%,_transparent_50%),radial-gradient(circle_at_80%_80%,_rgba(168,85,247,0.05)_0%,_transparent_50%)] text-yellow-500 p-4 pb-24 font-mono">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white flex items-center gap-3">
            <Shield className="text-yellow-500 w-8 h-8" />
            QG Parental
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

      {children.length === 0 ? (
        /* EMPTY STATE - LINK CHILD */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center mt-12"
        >
          <Card className="bg-zinc-900/80 border-purple-500/30 backdrop-blur-md p-8 text-center max-w-lg w-full shadow-[0_0_50px_rgba(168,85,247,0.15)]">
            <div className="flex flex-col items-center space-y-6">
              <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center ring-1 ring-purple-500/30">
                <UserPlus className="w-12 h-12 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Lier un compte enfant
                </h2>
                <p className="text-gray-400">
                  Entrez le nom d'utilisateur de votre enfant pour activer la
                  supervision parentale.
                </p>
              </div>

              <div className="flex gap-2 w-full">
                <Input
                  placeholder="Ex: Kevin_Junior"
                  className="bg-black/50 border-white/10 text-white"
                  value={childUsername}
                  onChange={(e) => setChildUsername(e.target.value)}
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
            </div>
          </Card>
        </motion.div>
      ) : (
        /* DASHBOARD CONTENT */
        <div className="space-y-6">
          {/* Child Selector */}
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`flex items-center gap-3 px-4 py-2 rounded-full border-2 transition-all whitespace-nowrap ${
                  selectedChildId === child.id
                    ? "bg-yellow-500 border-yellow-400 text-black font-bold scale-105"
                    : "bg-zinc-900 border-white/10 text-gray-400 hover:border-yellow-500/50"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10">
                  {child.avatarUrl ? (
                    <img
                      src={child.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaChild />
                  )}
                </div>
                {child.username}
              </button>
            ))}
            <button
              onClick={() => {
                const name = prompt("Nom d'utilisateur de l'enfant:");
                if (name) {
                  setChildUsername(name);
                  handleLinkChild();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-dashed border-white/10 text-gray-500 hover:border-purple-500/50 hover:text-purple-400 transition-all font-bold whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" /> Ajouter
            </button>
          </div>
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
              <TabsTrigger
                value="geofencing"
                className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
              >
                Geo-fencing
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
                    {selectedChild?.username || "l'enfant"}.
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

            {/* GEOFENCING TAB */}
            <TabsContent value="geofencing" className="space-y-6">
              <Card className="bg-zinc-900 border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FaHive className="text-yellow-500" /> Le Honey-Fence
                  </CardTitle>
                  <CardDescription>
                    Définit un périmètre de sécurité géographique. L'enfant
                    reçoit une alerte s'il sort de la zone autorisée pendant les
                    heures de jeu.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Home Coordinates */}
                  <div className="space-y-4">
                    <Label className="text-base text-gray-200">
                      Localisation "Maison"
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">
                          Latitude
                        </Label>
                        <Input
                          type="number"
                          value={controls.homeLat || ""}
                          onChange={(e) =>
                            setControls((prev) => ({
                              ...prev,
                              homeLat: parseFloat(e.target.value),
                            }))
                          }
                          className="bg-black/50 border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">
                          Longitude
                        </Label>
                        <Input
                          type="number"
                          value={controls.homeLng || ""}
                          onChange={(e) =>
                            setControls((prev) => ({
                              ...prev,
                              homeLng: parseFloat(e.target.value),
                            }))
                          }
                          className="bg-black/50 border-white/10"
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-dashed border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                      onClick={handleSetCurrentLocation}
                    >
                      Utiliser ma position actuelle
                    </Button>
                  </div>

                  <div className="h-px bg-white/10" />

                  {/* Radius Slider */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base text-gray-200">
                        Rayon autorisé
                      </Label>
                      <span className="text-yellow-500 font-mono font-bold text-lg">
                        {controls.allowedRadiusMeters} m
                      </span>
                    </div>
                    <Slider
                      defaultValue={[controls.allowedRadiusMeters || 500]}
                      max={5000}
                      min={100}
                      step={50}
                      value={[controls.allowedRadiusMeters || 500]}
                      onValueChange={handleGeoRadiusChange}
                      className="py-2"
                    />
                    <p className="text-xs text-gray-500">
                      L'enfant doit rester dans ce périmètre autour du point
                      central.
                    </p>
                  </div>

                  <Button
                    onClick={handleSaveControls}
                    className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-bold mt-4"
                    disabled={loading}
                  >
                    {loading ? "Sauvegarde..." : "Activer le Honey-Fence"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default ParentalDashboard;
