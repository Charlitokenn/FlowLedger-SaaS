"use client";

import { Section } from "../section";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "Can I cancel anytime?",
    answer: "Yes. You can downgrade or cancel your subscription at any time from your billing settings.",
  },
  {
    question: "Is my data safe?",
    answer:
      "We use industry-standard encryption in transit and at rest, with automatic daily backups.",
  },
  {
    question: "Can I upgrade later?",
    answer:
      "You can move from Starter to Growth or Scale without losing any of your historical data.",
  },
];

export function PricingFaqSection() {
  return (
    <Section>
      <div className="mx-auto max-w-3xl space-y-6">
        <h2 className="text-xl font-semibold text-foreground text-center">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {FAQS.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border border-border bg-card px-4 py-3 text-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-foreground">
                <span>{item.question}</span>
                <span className="text-xs text-muted-foreground group-open:hidden">+</span>
                <span className="hidden text-xs text-muted-foreground group-open:inline">–</span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
