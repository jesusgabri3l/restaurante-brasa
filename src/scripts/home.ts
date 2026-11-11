import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { startSmoothScroll } from './smooth-scroll';
import { startHeroSequence } from './hero-sequence';
import { startFloaters } from './floaters';
import { startParticles } from './particles';
import { startMenuTabs } from './menu-tabs';
import { startStoryMotion } from './story-motion';
import { startNavbarLogo } from './navbar';
import { startMascotMotion } from './mascot-motion';

gsap.registerPlugin(ScrollTrigger);

startSmoothScroll();
startHeroSequence();
startFloaters();
startParticles();
startMenuTabs();
startStoryMotion();
startNavbarLogo();
startMascotMotion();
