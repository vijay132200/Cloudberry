import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function BlogsPage() {
  const blogs = [
    {
      title: "Understanding GLP-1 Medications: What They Do and Who They're For",
      category: "Medical",
      date: "Oct 12, 2025",
      readTime: "5 min read",
      img: "/images/blog-1.png",
      excerpt: "A clinical overview of the new class of weight management medications, their mechanisms, and when they are medically appropriate."
    },
    {
      title: "The Myth of Willpower in Weight Management",
      category: "Metabolic Health",
      date: "Oct 05, 2025",
      readTime: "4 min read",
      img: "/images/blog-6.png",
      excerpt: "Why obesity is a complex biological disease, not a failure of character, and how understanding your metabolism changes the approach to treatment."
    },
    {
      title: "Building a Sustainable Mediterranean-Style Nutrition Framework",
      category: "Nutrition",
      date: "Sep 28, 2025",
      readTime: "6 min read",
      img: "/images/blog-2.png",
      excerpt: "Moving away from restrictive diets toward a scientifically-backed eating pattern that supports heart health and glucose regulation."
    },
    {
      title: "How Sleep Architecture Impacts Insulin Resistance",
      category: "Lifestyle",
      date: "Sep 15, 2025",
      readTime: "4 min read",
      img: "/images/blog-3.png",
      excerpt: "The overlooked connection between sleep deprivation, cortisol levels, and your body's ability to process glucose effectively."
    },
    {
      title: "Zone 2 Training: The Foundation of Metabolic Conditioning",
      category: "Fitness",
      date: "Sep 02, 2025",
      readTime: "5 min read",
      img: "/images/blog-4.png",
      excerpt: "Why low-intensity, steady-state cardio is often more effective for mitochondrial health than high-intensity interval training."
    },
    {
      title: "Managing Stress-Induced Cortisol and Weight Plateau",
      category: "Mental Health",
      date: "Aug 20, 2025",
      readTime: "3 min read",
      img: "/images/blog-5.png",
      excerpt: "Exploring the physiological link between chronic psychological stress and the body's reluctance to release stored fat."
    }
  ];

  return (
    <MarketingLayout>
      <div className="bg-muted/30 py-16 border-b">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">Metabolic Health Insights</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Evidence-based articles, research breakdowns, and lifestyle guides from the Cloudberry clinical team.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 max-w-5xl py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog, i) => (
            <Link key={i} href="#" className="group block">
              <Card className="overflow-hidden border-border h-full flex flex-col hover:shadow-md transition-all hover:border-primary/30">
                <div className="aspect-video w-full overflow-hidden bg-muted relative">
                  {blog.img ? (
                    <img src={blog.img} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">Image</div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white/90 text-foreground hover:bg-white backdrop-blur-sm border-none shadow-sm">{blog.category}</Badge>
                  </div>
                </div>
                <CardContent className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 font-medium">
                    <span>{blog.date}</span>
                    <span>•</span>
                    <span>{blog.readTime}</span>
                  </div>
                  <h3 className="text-xl font-bold font-serif leading-tight mb-3 group-hover:text-primary transition-colors">{blog.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mt-auto">{blog.excerpt}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </MarketingLayout>
  );
}
