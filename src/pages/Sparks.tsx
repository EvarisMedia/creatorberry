import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { useVideoSparks } from "@/hooks/useVideoSparks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Zap, TrendingUp, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Sparks = () => {
  const { user } = useAuth();
  const { brands } = useBrands();
  const navigate = useNavigate();
  const activeBrand = brands?.[0];
  const { sparks, isLoading } = useVideoSparks(activeBrand?.id);

  if (!user) {
    navigate("/auth");
    return null;
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "🔥 Hot", className: "bg-red-500/10 text-red-500" };
    if (score >= 60) return { label: "📈 Rising", className: "bg-orange-500/10 text-orange-500" };
    if (score >= 40) return { label: "💎 Niche", className: "bg-blue-500/10 text-blue-500" };
    return { label: "New", className: "bg-muted text-muted-foreground" };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Video Sparks</h1>
            <p className="text-muted-foreground">Discover high-potential video topics</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Spark
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading sparks...</div>
        ) : sparks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sparks yet</h3>
              <p className="text-muted-foreground mb-4">Add content sources to start generating video ideas automatically.</p>
              <Button onClick={() => navigate("/sources")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Sources
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sparks.map((spark) => {
              const scoreBadge = getScoreBadge(spark.combined_score);
              return (
                <Card key={spark.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2">{spark.title}</CardTitle>
                      <Badge className={scoreBadge.className}>{scoreBadge.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {spark.suggested_angle && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{spark.suggested_angle}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Velocity: {spark.velocity_score}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Outlier: {spark.outlier_score}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sparks;
