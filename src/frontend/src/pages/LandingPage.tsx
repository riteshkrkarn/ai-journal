import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import image from "../assets/landing-page-img.png";
import Navbar from "./Navbar";

function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/auth");
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2,
      },
    },
  };

  const imageVariants: Variants = {
    hidden: { opacity: 0, x: -60, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.6, 0.05, 0.01, 0.9],
      },
    },
  };

  const contentVariants: Variants = {
    hidden: { opacity: 0, x: 60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: [0.6, 0.05, 0.01, 0.9],
      },
    },
  };

  const headingVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.6, 0.05, 0.01, 0.9],
      },
    },
  };

  const buttonVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.6, 0.05, 0.01, 0.9],
      },
    },
  };

  return (
    <div className="h-screen w-full bg-black overflow-hidden flex flex-col font-[Inter,sans-serif] relative">
      {/* Subtle animated background gradients */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#016BFF] rounded-full filter blur-[120px] animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#4BBEBB] rounded-full filter blur-[120px] animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Navbar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-transparent relative z-10"
      >
        <Navbar />
      </motion.div>

      {/* Main Content - Perfectly centered */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="
          flex-1
          flex flex-col items-center justify-center 
          px-4 sm:px-6 md:px-8 lg:px-16
          py-6 md:py-0
          md:flex-row md:justify-center md:gap-12 lg:gap-20
          relative z-10
        "
      >
        {/* Image Section */}
        <motion.div
          variants={imageVariants}
          whileHover={{ scale: 1.02, rotate: 1 }}
          className="w-full md:w-auto flex items-center justify-center mb-8 md:mb-0"
        >
          <div className="relative">
            {/* Enhanced glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#016BFF]/30 to-[#4BBEBB]/30 rounded-2xl blur-3xl"></div>
            <img
              src={image}
              alt="Professional illustration of a journaling interface providing AI insights"
              className="
                relative
                w-full max-w-[280px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[500px]
                h-auto 
                object-contain
                rounded-2xl 
                shadow-2xl shadow-[#4BBEBB]/40
                border border-[#4BBEBB]/20
              "
            />
          </div>
        </motion.div>

        {/* Content Section */}
        <motion.div
          variants={contentVariants}
          className="
            flex flex-col 
            items-center md:items-start 
            text-center md:text-left
            w-full max-w-xl
          "
        >
          {/* Trust Badge */}
          <motion.div
            variants={headingVariants}
            className="
              inline-flex items-center gap-2 
              px-4 py-2 mb-5
              rounded-full
              bg-gradient-to-r from-[#016BFF]/10 to-[#4BBEBB]/10
              border border-[#4BBEBB]/30
              backdrop-blur-sm
            "
          >
            <Sparkles className="w-4 h-4 text-[#4BBEBB]" />
            <span className="text-sm font-medium text-gray-300">
              AI-Powered Journaling
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            variants={headingVariants}
            className="
              text-5xl sm:text-5xl md:text-6xl lg:text-7xl
              font-extrabold 
              leading-tight
              mb-5
              tracking-tight
            "
          >
            <span className="text-white">Reflect</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]">
              IQ
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.h2
            variants={headingVariants}
            className="
              text-xl sm:text-2xl md:text-3xl 
              font-semibold 
              text-gray-200 
              mb-6
              tracking-tight
            "
          >
            Your AI Journal & Assistant
          </motion.h2>

          {/* Description */}
          <motion.p
            variants={headingVariants}
            className="
              text-gray-400
              mb-8
              max-w-full md:max-w-xl
              text-base sm:text-lg
              leading-relaxed
            "
          >
            Transform your daily reflections into profound insights with
            intelligent AI assistance. Track goals, analyze progress, and unlock
            personal growth.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={buttonVariants}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            {/* Primary CTA */}
            <motion.div
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleGetStarted}
                className="
                  w-full sm:w-auto
                  px-8 md:px-10
                  py-5 md:py-6
                  text-base md:text-lg
                  font-bold 
                  border-none
                  rounded-xl
                  bg-gradient-to-r from-[#4BBEBB] to-[#016BFF]
                  shadow-2xl shadow-[#4BBEBB]/50
                  hover:shadow-[#4BBEBB]/70
                  transition-all duration-300
                  text-black
                  hover:brightness-110
                  flex items-center gap-2
                  justify-center
                "
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>

            {/* Secondary CTA */}
            <motion.div
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                  onClick={() => navigate('/about')}  // Changed from scrollTo
                  variant="outline"
                  className=" w-full sm:w-auto
                  px-8 md:px-10
                  py-5 md:py-6
                  text-base md:text-lg
                  font-semibold
                  rounded-xl
                  border-2 border-[#4BBEBB]/40
                  bg-transparent
                  text-gray-300
                  hover:bg-[#4BBEBB]/10
                  hover:border-[#4BBEBB]/60
                  hover:text-white
                  transition-all duration-300"
            >
              Learn More
            </Button>
            </motion.div>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            variants={headingVariants}
            className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mt-8 text-gray-400 text-sm"
          ></motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default LandingPage;
