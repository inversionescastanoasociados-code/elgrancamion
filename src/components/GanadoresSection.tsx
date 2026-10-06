'use client';

import Image from 'next/image';

export type GanadorEntry = {
  id: string;
  tag: string;
  prize: string;
  name: string;
  ticket: string;
  video?: string;
  image?: string;
  shareUrl?: string;
  accent: string;
  note?: string;
  delivered?: boolean;
};

type Props = {
  sectionId: string;
  title: string;
  subtitle?: string;
  winners: GanadorEntry[];
};

export default function GanadoresSection({ sectionId, title, subtitle, winners }: Props) {
  return (
    <section id={sectionId} className="py-20 sm:py-28 bg-[#111113]">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="text-center mb-12 sm:mb-14">
          <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#FFB703] mb-3">
            Historias reales
          </p>
          <h2
            className="text-[clamp(36px,6vw,56px)] uppercase tracking-wide text-white"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 text-white/45 text-base max-w-lg mx-auto">{subtitle}</p>
          )}
        </div>

        <div
          className={`grid gap-8 lg:gap-10 ${
            winners.length === 1 ? 'grid-cols-1 max-w-xl mx-auto' : 'grid-cols-1 lg:grid-cols-2'
          }`}
        >
          {winners.map((winner) => (
            <article
              key={winner.id}
              className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#1a1a1e] shadow-xl"
            >
              <div className="relative w-full aspect-video bg-black">
                {winner.video ? (
                  <video
                    src={winner.video}
                    controls
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 w-full h-full object-cover"
                    title={`Ganador ${winner.name}`}
                  />
                ) : winner.image ? (
                  <Image
                    src={winner.image}
                    alt={`Premio entregado a ${winner.name}`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/30">
                    <i className="fas fa-trophy text-5xl" />
                  </div>
                )}
              </div>

              <div className="p-6 sm:p-7">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span
                    className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{
                      color: winner.accent,
                      backgroundColor: `${winner.accent}18`,
                      border: `1px solid ${winner.accent}40`,
                    }}
                  >
                    {winner.tag}
                  </span>
                  {winner.delivered && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-[#25D366] bg-[#25D366]/12 border border-[#25D366]/35">
                      <i className="fas fa-circle-check text-[11px]" />
                      Premio entregado
                    </span>
                  )}
                </div>

                <h3
                  className="text-2xl sm:text-3xl uppercase text-white mb-1"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  {winner.name}
                </h3>

                <p className="text-white/50 text-sm mb-4">{winner.prize}</p>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 py-2.5">
                    <i className="fas fa-ticket text-[#FFB703] text-xs" />
                    <span className="text-[11px] uppercase tracking-wider text-white/40">Boleta</span>
                    <span
                      className="text-xl text-white tabular-nums"
                      style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '2px' }}
                    >
                      {winner.ticket}
                    </span>
                  </div>
                  {winner.note && (
                    <p className="text-[13px] text-[#25D366] font-semibold">
                      <i className="fas fa-money-bill-wave mr-1.5 text-xs" />
                      {winner.note}
                    </p>
                  )}
                </div>

                {winner.shareUrl && (
                  <a
                    href={winner.shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold text-[#1877F2] hover:text-[#4da3ff] transition-colors"
                  >
                    <i className="fab fa-facebook" />
                    Ver también en Facebook
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
