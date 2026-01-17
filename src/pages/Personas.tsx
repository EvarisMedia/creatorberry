import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { useVoiceAndPersonas } from "@/hooks/useVoiceAndPersonas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Personas = () => {
  const { user } = useAuth();
  const { brands } = useBrands();
  const navigate = useNavigate();
  const activeBrand = brands?.[0];
  const { personas, isLoading } = useVoiceAndPersonas(activeBrand?.id);

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Audience Personas</h1>
            <p className="text-muted-foreground">Define your target viewers for personalized scripts</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Persona
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading personas...</div>
        ) : personas.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No personas yet</h3>
              <p className="text-muted-foreground mb-4">Create audience avatars to help AI tailor scripts to your viewers.</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Persona
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {personas.map((persona) => (
              <Card key={persona.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{persona.name}</CardTitle>
                    {persona.is_primary && (
                      <Badge className="bg-yellow-500/10 text-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        Primary
                      </Badge>
                    )}
                  </div>
                  {persona.age_range && (
                    <CardDescription>{persona.age_range} • {persona.location || "Global"}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {persona.interests && persona.interests.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">Interests:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {persona.interests.slice(0, 4).map((interest, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{interest}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {persona.pain_points && persona.pain_points.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">Pain Points:</span>
                      <p className="text-sm text-muted-foreground line-clamp-2">{persona.pain_points[0]}</p>
                    </div>
                  )}
                  {persona.preferred_video_length && (
                    <div className="text-xs text-muted-foreground">
                      Prefers: {persona.preferred_video_length} videos
                    </div>
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

export default Personas;
