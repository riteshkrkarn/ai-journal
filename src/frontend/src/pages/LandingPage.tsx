import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import image from "../assets/landing-page-img.png"
import Navbar from "./Navbar"

function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <>
    <div className='bg-black text-amber-50'>
        <Navbar/>
    </div>
    <div className=" 
      min-h-screen w-full 
      flex flex-col items-center justify-center 
      bg-black 
      p-4 sm:p-6 md:p-8 lg:p-16  
      md:flex-row md:justify-center md:gap-12 lg:gap-20
      font-[Inter,sans-serif]
    ">
        
        <img
          src={image}
          alt="Professional illustration of a journaling interface providing AI insights"
          className="
            w-full max-w-[250px] sm:max-w-xs h-auto 
            object-cover object-left-top
            mb-8 sm:mb-10 md:mb-0 
            md:w-5/12 md:max-w-md lg:max-w-lg
            md:object-contain md:object-left
            rounded-2xl shadow-2xl shadow-[#4bbebb]/20 
          "
        />
        <div className="
          flex flex-col 
          items-center md:items-start 
          text-center md:text-left
          w-full max-w-lg 
          px-4 sm:px-6 md:px-0
        ">
          <h1 className="
            text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight
            bg-clip-text text-transparent 
            bg-gradient-to-r 
            from-[#016BFF] to-[#4BBEBB] 
            lg:text-7xl
            mt-0 mb-4 sm:mb-6 md:mb-7
        ">
            ReflectIQ
        </h1>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#FFFFFF] mb-6 sm:mb-8">
            Your AI Journal & Assistant
          </h2>
        
          <p className="
            text-white 
            mb-8 sm:mb-10 
            max-w-full md:max-w-lg 
            text-base sm:text-lg
            leading-relaxed
          ">
            Revolutionize your journaling experience with AI Journal, the intelligent app that transforms your daily reflections into profound insights and personal growth.
          </p>
          
          <Button 
            onClick={handleGetStarted}
            variant="outline" 
            className="
                w-full sm:w-auto
                px-8 sm:px-10 md:px-12 
                py-3 sm:py-4 
                text-base sm:text-lg 
                font-bold border-none
                bg-gradient-to-r from-[#4BBEBB] to-[#016BFF]
                shadow-md 
                transform transition-transform hover:scale-105 
                text-black
            "
        >
            Get Started
        </Button>
        </div>
    </div>
    </>
  );
}

export default LandingPage;