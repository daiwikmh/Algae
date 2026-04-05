"use client";

import { motion } from "framer-motion";
import AnimatedSection from "@/components/animations/AnimatedSection";

type Metric = {
  label: string;
  value: string;
};

type SectionPageProps = {
  title: string;
  subtitle: string;
  metrics: Metric[];
};

export default function SectionPage({
  title,
  subtitle,
  metrics,
}: SectionPageProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-5"
    >
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
          Operational View
        </p>
        <h1 className="mt-2 text-4xl uppercase text-slate-100 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-xl text-slate-300 sm:text-2xl">
          {subtitle}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <AnimatedSection key={metric.label}>
            <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
              <p className="text-sm uppercase tracking-wide text-slate-400">
                {metric.label}
              </p>
              <p className="mt-2 text-3xl text-[#d4d19d] sm:text-4xl">
                {metric.value}
              </p>
            </div>
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection>
        <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900/80 to-slate-800/50 p-5 sm:p-6">
          <p className="text-xl text-slate-200 sm:text-2xl">
            This page is wired into the shared layout shell and inherits
            sidebar, header, and transition behavior.
          </p>
        </div>
      </AnimatedSection>
    </motion.section>
  );
}
