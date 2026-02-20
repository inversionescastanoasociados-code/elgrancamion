import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Prizes from '@/components/Prizes';
import Gallery from '@/components/Gallery';
import TruckSpecs from '@/components/TruckSpecs';
import HowItWorks from '@/components/HowItWorks';
import Testimonials from '@/components/Testimonials';
import Trust from '@/components/Trust';
import FinalCTA from '@/components/FinalCTA';
import Footer from '@/components/Footer';
import SocialProof from '@/components/SocialProof';
import WhatsAppButton from '@/components/WhatsAppButton';
import CursorGlow from '@/components/CursorGlow';

export default function Home() {
  return (
    <main>
      <Navbar />
      <WhatsAppButton />
      <CursorGlow />
      <SocialProof />

      {/* 1. Hero — Big statement */}
      <Hero />

      {/* 2. Prizes — What you can win */}
      <Prizes />

      {/* 3. Gallery — See the truck */}
      <Gallery />

      {/* 4. Specs — Technical details */}
      <TruckSpecs />

      {/* 5. How It Works — 3 steps + buy CTA */}
      <HowItWorks />

      {/* 6. Testimonials — Social proof */}
      <Testimonials />

      {/* 7. FAQ — Trust & objections */}
      <Trust />

      {/* 8. Final CTA — Close */}
      <FinalCTA />

      {/* 9. Footer */}
      <Footer />
    </main>
  );
}
