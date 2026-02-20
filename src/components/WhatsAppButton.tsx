'use client';

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/573000000000?text=Hola%2C%20quiero%20comprar%20una%20boleta%20de%20la%20Gran%20Rifa%20Camionera"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[60] group"
      aria-label="Comprar por WhatsApp"
    >
      <div className="relative">
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />

        {/* Button */}
        <div className="relative w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center shadow-[0_8px_30px_rgba(34,197,94,0.4)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.5)] transition-all hover:scale-110">
          <i className="fab fa-whatsapp text-white text-2xl" />
        </div>

        {/* Tooltip */}
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
          <div className="glass rounded-lg px-4 py-2 whitespace-nowrap">
            <span className="text-[12px] font-bold text-white/90">
              ¡Comprar Ahora!
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
