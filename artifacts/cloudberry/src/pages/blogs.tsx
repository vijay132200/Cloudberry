import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const blogs = [
  {
    title: "Understanding GLP-1 Medications: What They Do and Who They're For",
    category: "Medical",
    date: "Oct 12, 2025",
    readTime: "5 min read",
    img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    excerpt: "A clinical overview of the new class of weight management medications, their mechanisms, and when they are medically appropriate."
  },
  {
    title: "The Myth of Willpower in Weight Management",
    category: "Metabolic Health",
    date: "Oct 05, 2025",
    readTime: "4 min read",
    img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
    excerpt: "Why obesity is a complex biological disease, not a failure of character, and how understanding your metabolism changes the approach to treatment."
  },
  {
    title: "Building a Sustainable Mediterranean-Style Nutrition Framework",
    category: "Nutrition",
    date: "Sep 28, 2025",
    readTime: "6 min read",
    img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80",
    excerpt: "Moving away from restrictive diets toward a scientifically-backed eating pattern that supports heart health and glucose regulation."
  },
  {
    title: "How Sleep Architecture Impacts Insulin Resistance",
    category: "Lifestyle",
    date: "Sep 15, 2025",
    readTime: "4 min read",
    img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
    excerpt: "The overlooked connection between sleep deprivation, cortisol levels, and your body's ability to process glucose effectively."
  },
  {
    title: "Zone 2 Training: The Foundation of Metabolic Conditioning",
    category: "Fitness",
    date: "Sep 02, 2025",
    readTime: "5 min read",
    img: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80",
    excerpt: "Why low-intensity, steady-state cardio is often more effective for mitochondrial health than high-intensity interval training."
  },
  {
    title: "Managing Stress-Induced Cortisol and Weight Plateau",
    category: "Mental Health",
    date: "Aug 20, 2025",
    readTime: "3 min read",
    img: "https://images.unsplash.com/photo-1499728603263-13726abce5fd?auto=format&fit=crop&w=800&q=80",
    excerpt: "Exploring the physiological link between chronic psychological stress and the body's reluctance to release stored fat."
  }
];

const categoryColors: Record<string, string> = {
  Medical: "bg-blue-100 text-blue-700",
  "Metabolic Health": "bg-emerald-100 text-emerald-700",
  Nutrition: "bg-amber-100 text-amber-700",
  Lifestyle: "bg-purple-100 text-purple-700",
  Fitness: "bg-orange-100 text-orange-700",
  "Mental Health": "bg-rose-100 text-rose-700",
};

export default function BlogsPage() {
  return (
    <MarketingLayout>
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50/60 via-white to-amber-50/40 py-16 border-b border-border/30">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Metabolic Health Insights</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Evidence-based articles, research breakdowns, and lifestyle guides from the Cloudberry clinical team.
          </p>
        </div>
      </div>

      {/* Featured post */}
      <div className="bg-white border-b border-border/20">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl py-12">
          <Link href="#" className="group block">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="rounded-2xl overflow-hidden aspect-video shadow-md">
                <img
                  src={blogs[0].img}
                  alt={blogs[0].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div>
                <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 ${categoryColors[blogs[0].category]}`}>
                  {blogs[0].category}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-tight">
                  {blogs[0].title}
                </h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">{blogs[0].excerpt}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <span>{blogs[0].date}</span>
                  <span>•</span>
                  <span>{blogs[0].readTime}</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-gradient-to-br from-white to-blue-50/30">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.slice(1).map((blog, i) => (
              <Link key={i} href="#" className="group block">
                <Card className="overflow-hidden border-border/50 h-full flex flex-col hover:shadow-lg transition-all hover:border-primary/30 rounded-2xl bg-white">
                  <div className="aspect-video w-full overflow-hidden relative">
                    <img
                      src={blog.img}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full shadow-sm ${categoryColors[blog.category] || "bg-white/90 text-foreground"}`}>
                        {blog.category}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-5 flex-grow flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 font-medium">
                      <span>{blog.date}</span>
                      <span>•</span>
                      <span>{blog.readTime}</span>
                    </div>
                    <h3 className="text-lg font-bold leading-snug mb-3 group-hover:text-primary transition-colors">{blog.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mt-auto">{blog.excerpt}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
