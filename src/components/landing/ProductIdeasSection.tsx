import { useState } from "react";
import { BookOpen, FileText, ClipboardList, GraduationCap, Gift, FolderOpen, Users, Briefcase, Pen, Lightbulb, Sparkles, ArrowRight, Users2, Palette, BookMarked } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const templatesByType = [
  {
    id: "signature-ebook",
    icon: BookOpen,
    name: "Signature Framework Ebook",
    description: "Package your expertise into a step-by-step framework that positions you as the go-to expert in your niche.",
    includes: ["7-chapter outline", "Exercises", "Worksheets"],
    usageCount: 2847,
    gradient: "from-purple-500/20 to-pink-500/20"
  },
  {
    id: "quick-win-guide",
    icon: FileText,
    name: "Quick-Win Guide",
    description: "Solve one specific problem for your audience with a focused, actionable guide they can implement immediately.",
    includes: ["3-section structure", "Action checklist", "Resource links"],
    usageCount: 4123,
    gradient: "from-blue-500/20 to-cyan-500/20"
  },
  {
    id: "client-workbook",
    icon: ClipboardList,
    name: "Client Workbook",
    description: "Guide your coaching clients through a structured transformation with exercises and reflection prompts.",
    includes: ["12-week structure", "Reflection prompts", "Progress trackers"],
    usageCount: 1892,
    gradient: "from-green-500/20 to-emerald-500/20"
  },
  {
    id: "course-companion",
    icon: GraduationCap,
    name: "Course Companion",
    description: "Create support materials that enhance your online course with summaries, worksheets, and quizzes.",
    includes: ["Module summaries", "Worksheets", "Quizzes"],
    usageCount: 3456,
    gradient: "from-orange-500/20 to-amber-500/20"
  },
  {
    id: "lead-magnet-bundle",
    icon: Gift,
    name: "Lead Magnet Bundle",
    description: "Attract email subscribers with a irresistible collection of quick resources that showcase your expertise.",
    includes: ["Checklist", "Cheat sheet", "Mini-guide"],
    usageCount: 5678,
    gradient: "from-pink-500/20 to-rose-500/20"
  },
  {
    id: "resource-toolkit",
    icon: FolderOpen,
    name: "Resource Toolkit",
    description: "Create a comprehensive starter kit with templates, scripts, and swipe files your audience can use right away.",
    includes: ["Templates", "Scripts", "Swipe files"],
    usageCount: 2341,
    gradient: "from-indigo-500/20 to-purple-500/20"
  }
];

const templatesByNiche = [
  {
    id: "coaches",
    icon: Users,
    name: "For Coaches",
    description: "Templates designed for life coaches, business coaches, and transformation specialists.",
    templates: ["Transformation Workbook", "Goal-Setting Guide", "Session Prep Sheets"],
    usageCount: 3245,
    gradient: "from-emerald-500/20 to-teal-500/20"
  },
  {
    id: "course-creators",
    icon: GraduationCap,
    name: "For Course Creators",
    description: "Support materials and bonus content for online educators and knowledge entrepreneurs.",
    templates: ["Course Workbook", "Bonus Guide", "Student Resources"],
    usageCount: 4567,
    gradient: "from-blue-500/20 to-indigo-500/20"
  },
  {
    id: "consultants",
    icon: Briefcase,
    name: "For Consultants",
    description: "Professional documentation and client deliverables for service-based businesses.",
    templates: ["Methodology Guide", "Client Onboarding Kit", "Process Documentation"],
    usageCount: 2134,
    gradient: "from-amber-500/20 to-orange-500/20"
  },
  {
    id: "freelancers",
    icon: Palette,
    name: "For Freelancers",
    description: "Portfolio pieces and client-facing materials that help you win more projects.",
    templates: ["Service Guide", "Portfolio Deck", "Proposal Templates"],
    usageCount: 3789,
    gradient: "from-pink-500/20 to-purple-500/20"
  },
  {
    id: "authors",
    icon: Pen,
    name: "For Authors",
    description: "Companion materials and bonus content to enhance your book and engage readers.",
    templates: ["Book Companion Guide", "Reading Group Questions", "Bonus Chapter"],
    usageCount: 1876,
    gradient: "from-violet-500/20 to-fuchsia-500/20"
  },
  {
    id: "thought-leaders",
    icon: Lightbulb,
    name: "For Thought Leaders",
    description: "Content that establishes authority and spreads your ideas to a wider audience.",
    templates: ["Manifesto Template", "Framework Diagram", "Speaking Deck"],
    usageCount: 1543,
    gradient: "from-cyan-500/20 to-blue-500/20"
  }
];

const ProductIdeasSection = () => {
  const [activeTab, setActiveTab] = useState("type");

  return (
    <section id="templates" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            <Sparkles className="w-3 h-3 mr-1" />
            Templates & Ideas
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
            Start Creating in Minutes, Not Hours
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Browse our library of proven product templates and ideas. Pick one, customize it, and launch faster than ever.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">500+</p>
            <p className="text-sm text-muted-foreground">Templates Available</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">50K+</p>
            <p className="text-sm text-muted-foreground">Products Created</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">12</p>
            <p className="text-sm text-muted-foreground">Niche Categories</p>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="type" className="text-sm">
                <BookMarked className="w-4 h-4 mr-2" />
                By Product Type
              </TabsTrigger>
              <TabsTrigger value="niche" className="text-sm">
                <Users2 className="w-4 h-4 mr-2" />
                By Niche
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Templates by Type */}
          <TabsContent value="type" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templatesByType.map((template) => {
                const Icon = template.icon;
                return (
                  <Card 
                    key={template.id} 
                    className="group relative bg-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                  >
                    <CardContent className="p-6">
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${template.gradient} flex items-center justify-center mb-4`}>
                        <Icon className="w-7 h-7 text-primary" />
                      </div>

                      {/* Content */}
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {template.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {template.description}
                      </p>

                      {/* Includes Tags */}
                      <div className="mb-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Includes
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {template.includes.map((item, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="text-xs font-normal"
                            >
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <span className="text-xs text-muted-foreground">
                          {template.usageCount.toLocaleString()} creators used this
                        </span>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                          Use Template
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Templates by Niche */}
          <TabsContent value="niche" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templatesByNiche.map((niche) => {
                const Icon = niche.icon;
                return (
                  <Card 
                    key={niche.id} 
                    className="group relative bg-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                  >
                    <CardContent className="p-6">
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${niche.gradient} flex items-center justify-center mb-4`}>
                        <Icon className="w-7 h-7 text-primary" />
                      </div>

                      {/* Content */}
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {niche.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {niche.description}
                      </p>

                      {/* Template Examples */}
                      <div className="mb-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Popular Templates
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {niche.templates.map((template, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="text-xs font-normal"
                            >
                              {template}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <span className="text-xs text-muted-foreground">
                          {niche.usageCount.toLocaleString()} products created
                        </span>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                          Browse All
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8">
              <Lightbulb className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Can't find what you need?
              </h3>
              <p className="text-muted-foreground mb-6">
                Request a custom template and our team will create it for you. New templates are added weekly based on creator requests.
              </p>
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                Request a Template
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ProductIdeasSection;
