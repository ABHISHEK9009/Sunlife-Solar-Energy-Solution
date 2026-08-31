import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { blogPosts } from "@/lib/blog-data";
import { LeadQuoteForm } from "@/components/forms/LeadQuoteForm";
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  Share2,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) return { title: "Article Not Found" };

  return {
    title: `${post.title} | Sunlife Solar`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedDate,
      authors: [post.author],
    },
  };
}

export default function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = blogPosts.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-solar-dark via-solar-deep to-emerald-950 text-white pt-28 sm:pt-32 pb-16 sm:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Guides
          </Link>

          <div className="flex items-center gap-3 text-xs text-emerald-200">
            <span className="px-3 py-1 bg-white/10 rounded-full font-semibold">
              {post.category}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime}
            </span>
            <span>• {post.publishedDate}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-heading tracking-tight leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-2 pt-2 text-xs text-slate-300">
            <User className="w-4 h-4 text-sun-amber" />
            <span>Written by {post.author} (Founder, Sunlife Solar)</span>
          </div>
        </div>
      </section>

      {/* Body Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-8 space-y-8">
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base space-y-5">
              <div
                dangerouslySetInnerHTML={{
                  __html: post.content.replace(/\n/g, "<br />"),
                }}
              />
            </div>

            {/* FAQs if present */}
            {post.faqs && post.faqs.length > 0 && (
              <div className="pt-8 border-t border-slate-200 space-y-4">
                <h3 className="text-xl font-bold font-heading text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-solar-deep" />
                  <span>Frequently Asked Questions</span>
                </h3>
                <div className="space-y-3">
                  {post.faqs.map((f, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1"
                    >
                      <h4 className="font-bold text-sm text-slate-900">
                        {f.q}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {f.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar CTA */}
          <div className="lg:col-span-4 space-y-6 sticky top-24">
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-4">
              <h4 className="font-bold font-heading text-base text-slate-900">
                Need a Custom Solar Plan?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Get an exact quotation and shadow assessment for your rooftop in Narmadapuram or MP.
              </p>
              <Link
                href="/solar-calculator"
                className="block w-full py-2.5 px-4 bg-solar-deep hover:bg-solar-dark text-white font-semibold rounded-xl text-center text-xs shadow-md transition-colors"
              >
                Calculate My Savings →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Form */}
      <section className="py-16 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <LeadQuoteForm />
        </div>
      </section>
    </div>
  );
}
