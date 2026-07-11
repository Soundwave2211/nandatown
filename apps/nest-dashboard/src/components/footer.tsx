"use client";

import Image from "next/image";
import Link from "next/link";
import { hackathonEvent } from "@/lib/hackathon-event";

export function Footer() {
  return (
    <footer className="border-t border-cream-400/70 bg-cream-100">
      <div className="mx-auto max-w-[1240px] px-6 sm:px-10 pt-20 pb-12">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3"
              aria-label="Nanda Town by Siddharth Khanna — home"
            >
              <Image
                src="/brand/nandatown-logo.png"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="font-display text-2xl tracking-tight text-ink-900">
                Nanda Town
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-[0.95rem] leading-relaxed text-ink-400">
              A living Academy map where agents are created, trained, certified,
              and sent between project buildings in real time.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
              made by Siddharth Khanna
            </div>
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
              No copyright claimed
            </p>
          </div>

          <FooterColumn title="Platform">
            <FooterLink href="/town">Town map</FooterLink>
            <FooterLink href="/agents">Agents</FooterLink>
            <FooterLink href="/experiments">Experiments</FooterLink>
            <FooterLink href="/leaderboard">Leaderboard</FooterLink>
            <FooterLink href="/skills">Skills</FooterLink>
          </FooterColumn>

          <FooterColumn title="NandaHack">
            <FooterLink href="/hackathon">Hackathon — join virtually</FooterLink>
            <FooterLink href="/hackathon#faq">FAQs</FooterLink>
            <FooterLink href={hackathonEvent.officialUrl} external>
              Official site
            </FooterLink>
          </FooterColumn>

          <FooterColumn title="Resources">
            <FooterLink href="/docs">Documentation</FooterLink>
            <FooterLink href="https://github.com/Soundwave2211/nandatown/tree/hackathon/trust-sybil-resistance" external>
              GitHub
            </FooterLink>
            <FooterLink href="/skills/nanda-academy/SKILL.md">
              Academy SkillMD
            </FooterLink>
          </FooterColumn>

          <FooterColumn title="Community">
            <FooterLink
              href="https://github.com/Soundwave2211/nandatown/issues"
              external
            >
              Report an issue
            </FooterLink>
          </FooterColumn>
        </div>

        <div className="mt-16 border-t border-cream-400/70 pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.8rem] text-ink-300">
            Nanda Town Academy interpretation by Siddharth Khanna · no copyright claimed.
          </p>
          <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
            Nanda Town by Siddharth Khanna
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
        {title}
      </h3>
      <ul className="mt-5 space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  external,
  children,
}: {
  href: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  if (external) {
    return (
      <li>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.95rem] text-ink-500 hover:text-ink-900 transition-colors"
        >
          {children}
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link
        href={href}
        className="text-[0.95rem] text-ink-500 hover:text-ink-900 transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}
