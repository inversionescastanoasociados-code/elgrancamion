'use client';

const winners = [
  {
    id: 'crucero',
    tag: 'Anticipado · Proyecto 1',
    prize: 'Crucero por el Caribe',
    name: 'Alejandro Gallego',
    ticket: '8943',
    note: 'Eligió el premio en efectivo',
    video: '/uploads/ganadores/alejandro-gallego.MP4',
    shareUrl: 'https://www.facebook.com/share/v/18sNUfKt7R/?mibextid=wwXIfr',
    accent: '#25D366',
  },
  {
    id: 'mayor',
    tag: 'Premio mayor · Proyecto 1',
    prize: 'Premio Mayor',
    name: 'Brayan Cano',
    ticket: '4224',
    video: '/uploads/ganadores/brayan-cano.MP4',
    shareUrl: 'https://www.facebook.com/share/v/1DtKNaYpTo/?mibextid=wwXIfr',
    accent: '#FFB703',
  },
];

export default function GanadoresProyecto1() {
  return (
    <section id="ganadores-proyecto-1" className="py-20 sm:py-28 bg-[#111113]">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="text-center mb-12 sm:mb-14">
          <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#FFB703] mb-3">
            Historias reales
          </p>
          <h2
            className="text-[clamp(36px,6vw,56px)] uppercase tracking-wide text-white"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            Ganadores Proyecto 1
          </h2>
          <p className="mt-3 text-white/45 text-base max-w-lg mx-auto">
            Conoce a quienes ya ganaron con la Gran Rifa Camionera
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          {winners.map((winner) => (
            <article
              key={winner.id}
              className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#1a1a1e] shadow-xl"
            >
              <div className="relative w-full aspect-video bg-black">
                <video
                  src={winner.video}
                  controls
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover"
                  title={`Ganador ${winner.name}`}
                />
              </div>

              <div className="p-6 sm:p-7">
                <span
                  className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-4"
                  style={{
                    color: winner.accent,
                    backgroundColor: `${winner.accent}18`,
                    border: `1px solid ${winner.accent}40`,
                  }}
                >
                  {winner.tag}
                </span>

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

                <a
                  href={winner.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold text-[#1877F2] hover:text-[#4da3ff] transition-colors"
                >
                  <i className="fab fa-facebook" />
                  Ver también en Facebook
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
