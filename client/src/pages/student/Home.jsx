import React from "react";
import Hero from "../../components/student/Hero";
import Footer from "../../components/student/Footer";

const Home = () => {
  return (
    <div className="flex flex-col items-center space-y-7 text-center">
      <Hero />
      <Footer />
    </div>
  );
};

export default Home;
