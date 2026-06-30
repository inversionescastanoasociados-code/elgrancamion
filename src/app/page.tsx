import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import AnticipadoHighlight from '@/components/AnticipadoHighlight';
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

export default function Home() {
  return (
    <main>
      <Navbar />
      <WhatsAppButton />
      <SocialProof />

      <Hero />
      <AnticipadoHighlight />
      <Prizes />
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
