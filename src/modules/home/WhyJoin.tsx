'use client';

import {
  Award,
  Handshake,
  BookOpen,
  Building2,
  Lightbulb,
  Megaphone,
  Rocket,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { LinkButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SegmentedToggle } from '@/components/ui/Chips';
import { HOME_COPY } from './copy';

const ICONS: Record<string, LucideIcon> = {
  Award,
  Handshake,
  BookOpen,
  Building2,
  Lightbulb,
  Megaphone,
  Rocket,
  Users,
};

type Audience = 'members' | 'partners';

/**
 * Why join (home §5): a segmented switch between members and partners, four benefit tiles that alternate the
 * surface tone, and one tall call-to-action tile (a bento). The CTA tile follows the intake phase.
 */
export function WhyJoin({
  lang,
  applyLabel,
  headingId,
}: {
  lang: 'ar' | 'en';
  applyLabel: string;
  headingId: string;
}) {
  const t = HOME_COPY[lang];
  const [aud, setAud] = useState<Audience>('members');
  const items = t.why[aud];
  return (
    <div aria-labelledby={headingId}>
      <div className="mb-8">
        <SegmentedToggle
          label={t.whyTitle}
          value={aud}
          onChange={setAud}
          options={[
            { value: 'members', label: t.whyMembers },
            { value: 'partners', label: t.whyPartners },
          ]}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
        <Card variant="cta" className="flex flex-col justify-between gap-8 lg:row-span-2">
          <div className="flex flex-col gap-3">
            <h3 className="t-h3">{t.whyCtaTitle}</h3>
          </div>
          <LinkButton href="/join" size="lg" className="w-fit">
            {applyLabel}
          </LinkButton>
        </Card>
        {items.map(([icon, title, body], i) => {
          const Icon = ICONS[icon] ?? Rocket;
          return (
            <Card key={`${aud}-${title}`} variant={i % 2 === 0 ? 'feature' : 'feature-alt'}>
              <span
                aria-hidden="true"
                className="mb-4 flex size-12 items-center justify-center rounded-shape-md bg-accent-soft text-on-accent-soft"
              >
                <Icon className="size-6" />
              </span>
              <h3 className="t-h4">{title}</h3>
              <p className="t-body-sm mt-1 text-muted">{body}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
