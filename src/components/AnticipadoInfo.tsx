'use client';

import { useState, useEffect } from 'react';

/* ═══ Countdown to next Saturday ═══ */
function getNextSaturday() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  const daysUntilSat = (6 - day + 7) % 7 || 7; // If today is Saturday, next one
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilSat);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getTimeLeft(target: Date) {
  const now = new Date().getTime();
  const diff = target.getTime() - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function AnticipadoInfo() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setMounted(true);
    const target = getNextSaturday();
    setTimeLeft(getTimeLeft(target));
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(target));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="relative overflow-hidden bg-[#0D0D10]">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#E63946_0%,transparent_70%)] opacity-[0.04]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#FFB703_0%,transparent_60%)] opacity-[0.03]" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 py-16 sm:py-20">

        {/* ═══ SECTION HEADER ═══ */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-[#FFB703]/10 border border-[#FFB703]/20 rounded-full px-5 py-2 mb-5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFB703] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FFB703]" />
            </span>
            <span className="text-[11px] sm:text-[12px] font-bold tracking-[3px] uppercase text-[#FFB703]">
              Anticipados Semanales
            </span>
          </div>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl uppercase tracking-wider mb-3"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            ¡CADA SÁBADO{' '}
            <span className="bg-gradient-to-r from-[#FFB703] to-[#FFD700] bg-clip-text text-transparent">
              HAY PREMIO!
            </span>
          </h2>
          <p className="text-white/40 text-sm sm:text-base max-w-xl mx-auto">
            No tienes que esperar al sorteo final. Cada sábado se juega un anticipado con premios en efectivo.
          </p>
        </div>

        {/* ═══ TWO COLUMN LAYOUT ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

          {/* ── LEFT: Last result + Next anticipado ── */}
          <div className="space-y-6">

            {/* LAST RESULT CARD */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#E63946] to-[#FFB703] rounded-3xl opacity-20 blur-sm group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-gradient-to-br from-[#1A1A20] to-[#12121A] border border-white/[0.08] rounded-3xl p-6 sm:p-8 overflow-hidden">
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#E63946]/10 to-transparent rounded-bl-full" />

                <div className="relative z-10">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 bg-[#E63946]/15 border border-[#E63946]/25 rounded-full px-4 py-1.5 mb-5">
                    <span className="text-lg">📢</span>
                    <span className="text-[11px] font-bold tracking-[2px] uppercase text-[#E63946]">Resultado Anterior</span>
                  </div>

                  <p className="text-white/40 text-[13px] font-semibold mb-3">
                    El primer anticipado del <span className="text-white/70">sábado 7 de marzo</span> se jugó con la lotería:
                  </p>

                  {/* Result number highlight */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#FFB703] rounded-2xl blur-lg opacity-20 animate-pulse" />
                      <div className="relative bg-gradient-to-br from-[#FFB703]/20 to-[#FFD700]/10 border-2 border-[#FFB703]/50 rounded-2xl px-6 sm:px-8 py-4">
                        <p className="text-[10px] font-bold tracking-[3px] uppercase text-[#FFB703]/60 mb-1 text-center">Número ganador</p>
                        <p
                          className="text-4xl sm:text-5xl font-black text-[#FFD700] text-center tracking-[8px]"
                          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                        >
                          4715
                        </p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-green-400 text-[13px] font-bold">¡Estaba disponible!</span>
                      </div>
                      <p className="text-white/30 text-[12px] leading-relaxed">
                        El número <span className="text-[#FFB703] font-bold">4715</span> no tenía dueño.
                        El premio de <span className="text-white/60 font-bold">$2.000.000</span> queda{' '}
                        <span className="text-[#FFB703] font-bold">¡ACUMULADO!</span>
                      </p>
                    </div>
                  </div>

                  {/* Acumulado callout */}
                  <div className="bg-gradient-to-r from-[#FFB703]/10 to-transparent border-l-4 border-[#FFB703] rounded-r-xl px-4 py-3">
                    <p className="text-[#FFB703] text-[13px] font-bold flex items-center gap-2">
                      <i className="fas fa-coins text-sm" />
                      El anticipado se acumula para el próximo sábado
                    </p>
                    <p className="text-white/40 text-[12px] mt-1">
                      Al no tener dueño, los $2M se suman al siguiente sorteo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* NEXT ANTICIPADO CARD */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#25D366] to-[#FFB703] rounded-3xl opacity-20 blur-sm group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-gradient-to-br from-[#1A1A20] to-[#12121A] border border-white/[0.08] rounded-3xl p-6 sm:p-8 overflow-hidden">
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#25D366]/10 to-transparent rounded-bl-full" />

                <div className="relative z-10">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 bg-[#25D366]/15 border border-[#25D366]/25 rounded-full px-4 py-1.5 mb-5">
                    <span className="text-lg">🔥</span>
                    <span className="text-[11px] font-bold tracking-[2px] uppercase text-[#25D366]">Próximo Sábado</span>
                  </div>

                  <h3
                    className="text-2xl sm:text-3xl uppercase tracking-wider mb-2"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    ANTICIPADO{' '}
                    <span className="bg-gradient-to-r from-[#25D366] to-[#FFD700] bg-clip-text text-transparent">
                      ACUMULADO
                    </span>
                  </h3>

                  {/* Prize amount */}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span
                      className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-[#FFB703] to-[#FFD700] bg-clip-text text-transparent"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      $4.000.000
                    </span>
                    <span className="text-white/30 text-sm font-bold uppercase">COP</span>
                  </div>

                  <p className="text-white/40 text-[13px] leading-relaxed mb-5">
                    Acumulado de $2M anteriores + $2M del nuevo anticipado.{' '}
                    <span className="text-white/60 font-bold">¡Si tu número sale y eres el dueño, te llevas los 4 millones!</span>
                  </p>

                  {/* Countdown to next Saturday */}
                  <div className="bg-black/30 border border-white/[0.06] rounded-2xl p-4">
                    <p className="text-[10px] font-bold tracking-[3px] uppercase text-white/30 text-center mb-3">
                      Próximo sorteo en
                    </p>
                    <div className="grid grid-cols-4 gap-2 sm:gap-3">
                      {[
                        { value: timeLeft.days, label: 'Días' },
                        { value: timeLeft.hours, label: 'Horas' },
                        { value: timeLeft.minutes, label: 'Min' },
                        { value: timeLeft.seconds, label: 'Seg' },
                      ].map((item) => (
                        <div key={item.label} className="text-center">
                          <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl py-2.5 sm:py-3 mb-1">
                            <span
                              className="text-xl sm:text-2xl font-black text-white"
                              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                            >
                              {mounted ? pad(item.value) : '--'}
                            </span>
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white/30">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: TikTok Video + CTA ── */}
          <div className="space-y-6">

            {/* TIKTOK VIDEO EMBED */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF0050] to-[#00F2EA] rounded-3xl opacity-15 blur-sm group-hover:opacity-25 transition-opacity" />
              <div className="relative bg-gradient-to-br from-[#1A1A20] to-[#12121A] border border-white/[0.08] rounded-3xl p-5 sm:p-6 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center gap-2 bg-black/40 border border-white/[0.08] rounded-full px-4 py-1.5">
                    <i className="fab fa-tiktok text-white text-sm" />
                    <span className="text-[11px] font-bold tracking-[2px] uppercase text-white/60">En Vivo</span>
                  </div>
                  <a
                    href="https://www.tiktok.com/@elgrancamion.oficial?_r=1&_t=ZS-94LHsPFrtbR"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-white/30 hover:text-white/60 transition-all flex items-center gap-1"
                  >
                    @elgrancamion.oficial
                    <i className="fas fa-external-link-alt text-[9px]" />
                  </a>
                </div>

                {/* TikTok Embed */}
                <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/[0.06]">
                  <div className="aspect-[9/16] max-h-[500px] sm:max-h-[550px] w-full flex items-center justify-center">
                    <iframe
                      src="https://www.tiktok.com/embed/v/7614737656877960469"
                      className="w-full h-full"
                      allowFullScreen
                      allow="encrypted-media"
                      style={{ border: 'none' }}
                    />
                  </div>
                </div>

                {/* TikTok footer */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-white/30 text-[11px]">
                    <i className="fas fa-play text-[9px] mr-1" />
                    Mira cómo fue el sorteo del anticipado
                  </p>
                  <a
                    href="https://vt.tiktok.com/ZSu2vd4Ms/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/50 text-[11px] font-bold hover:bg-white/10 hover:text-white/70 transition-all"
                  >
                    <i className="fab fa-tiktok text-[10px]" />
                    Ver en TikTok
                  </a>
                </div>
              </div>
            </div>

            {/* CTA CARD */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#E63946] to-[#E63946] rounded-3xl opacity-20 blur-sm group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-gradient-to-br from-[#E63946]/10 to-[#1A1A20] border border-[#E63946]/20 rounded-3xl p-6 sm:p-8 text-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#E63946_0%,transparent_70%)] opacity-[0.06]" />
                <div className="relative z-10">
                  <p className="text-3xl mb-3">🎰</p>
                  <h3
                    className="text-xl sm:text-2xl uppercase tracking-wider mb-3"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    ¿AÚN NO TIENES{' '}
                    <span className="text-[#FFB703]">TU BOLETA?</span>
                  </h3>
                  <p className="text-white/40 text-[13px] mb-5 max-w-sm mx-auto">
                    Cada sábado puedes ganar. Si tu número sale en el anticipado, ¡te llevas el premio!
                  </p>
                  <a
                    href="/boletas"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#E63946] text-white text-[13px] font-bold uppercase tracking-wider hover:bg-[#d32f3c] shadow-xl shadow-[#E63946]/25 hover:shadow-[#E63946]/40 hover:scale-[1.02] transition-all"
                  >
                    <i className="fas fa-ticket text-[11px]" />
                    COMPRAR MI BOLETA AHORA
                  </a>
                  <p className="text-white/20 text-[11px] mt-3">
                    Por solo $25.000 participas en TODOS los sorteos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BOTTOM INFO STRIP ═══ */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: 'fas fa-calendar-check', title: 'Cada Sábado', desc: 'Sorteo con lotería oficial cada semana', color: '#FFB703' },
            { icon: 'fas fa-layer-group', title: 'Acumulable', desc: 'Si no sale dueño, el premio se acumula', color: '#25D366' },
            { icon: 'fas fa-trophy', title: 'Hasta $20M', desc: 'El anticipado puede crecer cada semana', color: '#E63946' },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-4 hover:bg-white/[0.05] transition-all"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}30` }}
              >
                <i className={`${item.icon} text-sm`} style={{ color: item.color }} />
              </div>
              <div>
                <p className="text-white text-[13px] font-bold">{item.title}</p>
                <p className="text-white/30 text-[11px]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
