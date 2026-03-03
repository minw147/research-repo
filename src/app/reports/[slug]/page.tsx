import { notFound } from "next/navigation";
import Link from "next/link";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import { getReportRaw, getAllReportFilenames, getStudyById, getTranscriptForStudy } from "@/lib/db";
import Clip from "@/components/Clip";
import { Slide } from "@/components/Slide";
import { ShareReport } from "@/components/ShareReport";
import { TranscriptProvider } from "@/context/TranscriptContext";
import { format } from "date-fns";
import { Calendar, LayoutList, Rows3 } from "lucide-react";

const blogComponents = {
  Clip,
  Slide,
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mb-6 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mb-4 mt-8 text-xl font-semibold text-slate-900" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mb-3 text-lg font-semibold text-slate-900" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-4 text-base leading-relaxed text-slate-600" {...props} />
  ),
};

// Slide-deck mode: Slide component is already registered; h2/p get
// additional styling via the .slides-mode CSS class in globals.css
const slideComponents = {
  ...blogComponents,
};

export async function generateStaticParams() {
  const filenames = getAllReportFilenames();
  return filenames.map((f) => ({
    slug: f.replace(/\.mdx?$/, ""),
  }));
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const raw =
    getReportRaw(`${slug}.mdx`) ?? getReportRaw(`${slug}.md`);

  if (!raw) notFound();

  const { data: frontmatterPreview } = matter(raw);
  const isSlides = frontmatterPreview?.layout === "slides";
  const components = isSlides ? slideComponents : blogComponents;

  const { content, frontmatter } = await compileMDX<{
    title: string;
    date?: string;
    studyId?: string;
    layout?: "blog" | "slides";
  }>({
    source: raw,
    options: {
      parseFrontmatter: true,
      mdxOptions: {},
    },
    components,
  });

  const study = frontmatter.studyId
    ? getStudyById(frontmatter.studyId)
    : null;
  const reportDate = frontmatter.date ?? study?.date;
  const author = study?.persona;
  const category = study?.product;
  const transcriptLines = study?.transcriptFile
    ? getTranscriptForStudy(study.transcriptFile) ?? []
    : [];
  const vttUrl = transcriptLines.length > 0 ? `/vtt/${slug}.vtt` : null;

  return (
    <article className={isSlides ? "max-w-none" : "prose prose-slate max-w-none dark:prose-invert"}>
      <TranscriptProvider lines={transcriptLines} vttUrl={vttUrl}>
      {/* Breadcrumbs */}
      <nav
        className="mb-4 flex items-center gap-2 text-sm text-slate-500"
        aria-label="Breadcrumb"
      >
        <Link href="/library" className="hover:text-primary transition-colors">
          Library
        </Link>
        <span className="text-slate-400">›</span>
        <Link href="/library" className="hover:text-primary transition-colors">
          Reports
        </Link>
        <span className="text-slate-400">›</span>
        <span className="font-medium text-slate-900">{frontmatter.title}</span>
      </nav>

      {/* Title Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            {frontmatter.title}
          </h1>
          <ShareReport slug={slug} title={frontmatter.title} />
        </div>

        {/* Metadata */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
          {author && (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-slate-300" />
              <span>{author}</span>
            </div>
          )}
          {reportDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>{format(new Date(reportDate), "MMM d, yyyy")}</span>
            </div>
          )}
          {category && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {category}
            </span>
          )}
          {/* Layout badge */}
          {isSlides ? (
            <span className="ml-auto flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-500">
              <Rows3 className="h-3 w-3" />
              Slide deck
            </span>
          ) : (
            <span className="ml-auto flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-500">
              <LayoutList className="h-3 w-3" />
              Article
            </span>
          )}
        </div>
      </div>

      {/* MDX Content */}
      <div className={isSlides ? "slides-mode" : ""}>
        {content}
      </div>
      </TranscriptProvider>
    </article>
  );
}
