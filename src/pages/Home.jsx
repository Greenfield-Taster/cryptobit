import React from "react";

import AboutSection from "../components/Sections/AboutSection";
import TransactionSection from "../components/Sections/TransactionSection";
import HomeSection from "../components/Sections/HomeSection";
import TestimonialSection from "../components/Sections/Testimonial";
import FrequentlyQASection from "../components/Sections/FrequentlyQA";

const Home = ({
  homeRef,
  aboutRef,
  transactionRef,
  testimonialRef,
  frequentlyQARef,
}) => {
  const handleNavigation = (section) => {
    if (section === "about") {
      const yOffset = -84;
      const y =
        aboutRef.current?.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset;
      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
    if (section === "transaction") {
      const yOffset = -84;
      const y =
        transactionRef.current?.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset;
      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
    if (section === "home") {
      const yOffset = -84;
      const y =
        homeRef.current?.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset;
      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
    if (section === "testimonial") {
      const yOffset = -84;
      const y =
        homeRef.current?.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset;
      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
    if (section === "frequentlyQA") {
      const yOffset = -84;
      const y =
        homeRef.current?.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset;
      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
  };
  return (
    <>
      <div ref={homeRef}>
        <HomeSection onNavigate={handleNavigation} />
      </div>
      <div ref={transactionRef}>
        <TransactionSection />
      </div>
      <div ref={aboutRef}>
        <AboutSection />
      </div>
      <div ref={testimonialRef}>
        <TestimonialSection />
      </div>
      <div ref={frequentlyQARef}>
        <FrequentlyQASection />
      </div>
    </>
  );
};

export default Home;
