import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="flex justify-between items-center p-4 md:p-6">
      <div 
        className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] cursor-pointer"
        onClick={() => navigate('/')}
      >
        ReflectIQ
      </div>
      
      <div className="flex gap-4">
        <Button 
          onClick={() => navigate('/auth')}
          variant="ghost" 
          className="text-white hover:text-[#4BBEBB]"
        >
          Log In
        </Button>
        <Button 
          onClick={() => navigate('/auth')}
          className="bg-gradient-to-r from-[#4BBEBB] to-[#016BFF] text-black hover:opacity-90"
        >
          Sign Up
        </Button>
      </div>
    </nav>
  );
}

export default Navbar;

