import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { useVoiceAndPersonas } from "@/hooks/useVoiceAndPersonas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Mic, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const VoiceProfile = () => {
  const { user } = useAuth();
  const { brands } = useBrands();
  const navigate = useNavigate();
  const activeBrand = brands?.[0];
  const { voiceProfiles, isLoading } = useVoiceAndPersonas(activeBrand?.id);

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Voice Profile</h1>
            <p className="text-muted-foreground">Define your unique speaking style for AI-generated scripts</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Voice
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading voice profiles...</div>
        ) : voiceProfiles.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No voice profile yet</h3>
              <p className="text-muted-foreground mb-4">Upload video transcripts to train your unique voice DNA.</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Voice Profile
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {voiceProfiles.map((profile) => (
              <Card key={profile.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{profile.name}</CardTitle>
                    {profile.is_active && (
                      <Badge className="bg-green-500/10 text-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Analyzed from {profile.analyzed_transcripts || 0} transcripts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.vocabulary_style && (
                    <div>
                      <span className="text-xs text-muted-foreground">Vocabulary:</span>
                      <p className="text-sm">{profile.vocabulary_style}</p>
                    </div>
                  )}
                  {profile.humor_style && (
                    <div>
                      <span className="text-xs text-muted-foreground">Humor:</span>
                      <p className="text-sm">{profile.humor_style}</p>
                    </div>
                  )}
                  {profile.signature_expressions && profile.signature_expressions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {profile.signature_expressions.slice(0, 3).map((expr, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{expr}</Badge>
                      ))}
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

export default VoiceProfile;
