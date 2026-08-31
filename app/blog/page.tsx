import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { blogPosts } from "@/lib/blog-data";
import { BookOpen, Calendar, Clock, User, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Solar Guides & Knowledge Hub | Sunlife Solar Energy Solution",
  description:
    "Expert solar guides, technical pricing breakdowns, rooftop sizing tips, and government subsidy advice for homeowners and businesses in Madhya Pradesh.",
};

export default function BlogHubPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-r from-solar-dark via-solar-deep to-emerald-950 text-white pt-28 sm:pt-32 pb-16 sm:pb-20">
        <div className="fluid-container">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-sun-amber uppercase tracking-wider bg-white/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Solar Knowledge & Guides
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight">
              Solar Energy Guides & Sizing Articles
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
              Clear, practical information on rooftop solar economics, net metering policies, and technical engineering in Madhya Pradesh.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Cards Grid */}
      <section className="py-16 sm:py-20">
        <div className="fluid-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm hover:shadow-premium transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="px-3 py-1 rounded-full bg-emerald-100/70 text-solar-deep font-semibold">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readTime}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 group-hover:text-solar-deep transition-colors leading-snug">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>

                  <p className="text-slate-600 text-sm leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User className="w-3.5 h-3.5 text-solar-deep" />
                    <span>{post.author}</span>
                  </div>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-solar-deep group-hover:text-solar-dark group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
