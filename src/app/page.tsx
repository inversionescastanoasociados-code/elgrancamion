import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import AnticipadoHighlight from '@/components/AnticipadoHighlight';
import Prizes from '@/components/Prizes';
import GanadoresProyecto1 from '@/components/GanadoresProyecto1';
import Gallery from '@/components/Gallery';
import TruckSpecs from '@/components/TruckSpecs';
import HowItWorks from '@/components/HowItWorks';
import Testimonials from '@/components/Testimonials';
import Trust from '@/components/Trust';
import FinalCTA from '@/components/FinalCTA';
import Footer from '@/components/Footer';
import SocialProof from '@/components/SocialProof';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function Home() {
  return (
    <main>
      <Navbar />
      <WhatsAppButton />
      <SocialProof />

      <Hero />
      <AnticipadoHighlight />
      <Prizes />
      <GanadoresProyecto1 />
      <Gallery />
      <TruckSpecs />
      <HowItWorks />
      <Testimonials />
      <Trust />
      <FinalCTA />
      <Footer />
    </main>
  );
}
