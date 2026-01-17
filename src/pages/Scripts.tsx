import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { useScripts } from "@/hooks/useScripts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Scripts = () => {
  const { user } = useAuth();
  const { brands } = useBrands();
  const navigate = useNavigate();
  const activeBrand = brands?.[0];
  const { scripts, isLoading } = useScripts(activeBrand?.id);

  if (!user) {
    navigate("/auth");
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-500";
      case "in_progress": return "bg-blue-500/10 text-blue-500";
      case "review": return "bg-yellow-500/10 text-yellow-500";
      case "published": return "bg-purple-500/10 text-purple-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Scripts</h1>
            <p className="text-muted-foreground">Manage your YouTube video scripts</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Script
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading scripts...</div>
        ) : scripts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No scripts yet</h3>
              <p className="text-muted-foreground mb-4">Start by creating your first script from a Spark or from scratch.</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Script
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {scripts.map((script) => (
              <Card key={script.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{script.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {script.target_length_minutes} min • {script.estimated_word_count || 0} words
                    </p>
                  </div>
                  <Badge className={getStatusColor(script.status)}>{script.status}</Badge>
                </CardHeader>
                <CardContent>
                  {script.hook && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{script.hook}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Scripts;
