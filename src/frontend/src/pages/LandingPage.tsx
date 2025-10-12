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
      h-161 w-full 
      flex flex-col items-center justify-center 
      bg-black 
      p-8 md:p-16  
      md:flex-row md:justify-center md:gap-20
      font-[Inter,sans-serif]
    ">
        
        <img
          src={image}
          alt="Professional illustration of a journaling interface providing AI insights"
          className="
            w-full max-w-xs h-auto 
            object-cover object-left-top
            mb-10 md:mb-0 
            md:w-5/12 md:max-w-lg
            md:object-contain md:object-left
            rounded-2xl shadow-2xl shadow-[#4bbebb]/20 
          "
        />
        <div className="
          flex flex-col 
          items-center md:items-start 
          text-center md:text-left
          w-full max-w-lg 
        ">
          <h1 className="
            text-6xl font-extrabold leading-tight
            bg-clip-text text-transparent 
            bg-gradient-to-r 
            from-[#016BFF] to-[#4BBEBB] 
            lg:text-7xl
            mt-0 mb-6 md:mb-7
        ">
            ReflectIQ
        </h1>

          <h2 className="text-3xl font-semibold text-[#FFFFFF] mb-8">Your AI Journal & Assistant</h2>
        
          <p className="
            text-white 
            mb-10 
            max-w-full md:max-w-lg 
            text-lg
          ">
            Revolutionize your journaling experience with AI Journal, the intelligent app that transforms your daily reflections into profound insights and personal growth.
          </p>
          
          <Button 
            onClick={handleGetStarted}
            variant="outline" 
            className="
                px-12 py-4 text-black text-lg font-bold border-none
                bg-gradient-to-r from-[#4BBEBB] to-[#016BFF]
                shadow-md 
                transform transition-transform hover:scale-105 
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
