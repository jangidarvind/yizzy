import { Hero } from '../features/landing/Hero';
import { HowItWorks } from '../features/landing/HowItWorks';
import { Calculator } from '../features/landing/calculator/Calculator';
import { MarketStats } from '../features/landing/MarketStats';
import { SiteFooter } from '../components/SiteFooter';

export function LandingPage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Calculator />
      <MarketStats />
      <SiteFooter />
    </>
  );
}
