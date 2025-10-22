import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import type { Variants } from "framer-motion"
import { 
  Sparkles, 
  Target, 
  Search,
  Calendar,
  Brain,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Code2,
  Database,
  Lock,
  Github
} from "lucide-react"
import Navbar from "./Navbar"

// Add X icon component
const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);


function About() {
  const navigate = useNavigate();

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.6, 0.05, 0.01, 0.9]
      }
    }
  };

  const slideInLeft: Variants = {
    hidden: { opacity: 0, x: -60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        ease: [0.6, 0.05, 0.01, 0.9]
      }
    }
  };

  const features = [
    {
      icon: Brain,
      title: "Autonomous Journaling",
      description: "Auto-detects and saves daily reflections. No buttons needed—just chat naturally and the AI decides what to do.",
      gradient: "from-[#016BFF] to-[#4BBEBB]"
    },
    {
      icon: Search,
      title: "Semantic Search",
      description: "Find entries by meaning, not keywords. Uses 768-dimensional vectors for intelligent context-based search.",
      gradient: "from-[#4BBEBB] to-[#016BFF]"
    },
    {
      icon: Target,
      title: "Smart Goal Tracking",
      description: "AI monitors progress via journal analysis. Automatically tracks goals when you mention deadlines in conversation.",
      gradient: "from-[#016BFF] to-[#4BBEBB]"
    },
    {
      icon: Calendar,
      title: "Calendar Integration",
      description: "Natural language → Google Calendar events. Schedule from conversation without manual data entry.",
      gradient: "from-[#4BBEBB] to-[#016BFF]"
    },
    {
      icon: MessageSquare,
      title: "Real-time Chat",
      description: "WebSocket with typing effects and auto-reconnect. Experience seamless, instant communication.",
      gradient: "from-[#016BFF] to-[#4BBEBB]"
    },
    {
      icon: Lock,
      title: "Multi-user Auth",
      description: "Secure JWT-based authentication with Supabase Auth and Google OAuth 2.0 integration.",
      gradient: "from-[#4BBEBB] to-[#016BFF]"
    }
  ];

  const techStack = [
    { 
      category: "Frontend", 
      tech: "React 18, TypeScript, Vite, Tailwind CSS, WebSocket",
      icon: Code2,
      color: "text-blue-400"
    },
    { 
      category: "Backend", 
      tech: "Express.js, TypeScript, WebSocket (ws), Supabase PostgreSQL + pgvector",
      icon: Database,
      color: "text-cyan-400"
    },
    { 
      category: "AI", 
      tech: "IQ AI ADK v0.3.7, Google Gemini 2.5 Flash, text-embedding-004 (768-dim)",
      icon: Brain,
      color: "text-purple-400"
    },
    { 
      category: "Auth", 
      tech: "Supabase Auth, JWT tokens, Google OAuth 2.0",
      icon: Lock,
      color: "text-green-400"
    }
  ];

  const usageExamples = [
    {
      title: "Journaling",
      user: "Today I finished the auth system and deployed to production",
      ai: "Great work! I've saved that to your journal."
    },
    {
      title: "Goals",
      user: "I want to complete 15 DSA topics by December 31st",
      ai: "Goal created: \"Complete 15 DSA topics\". You can check it in the Goals page."
    },
    {
      title: "Search",
      user: "When did I work on the calendar feature?",
      ai: "October 11th: \"Built Google Calendar OAuth integration...\""
    }
  ];

  const developers = [
    {
      name: "Ritesh Kumar Karn",
      role: "Full Stack Developer",
      twitter: "https://twitter.com/riteshkrkarn",
      github: "https://github.com/riteshkrkarn",
      initial: "R"
    },
    {
      name: "Khushi Mishra",
      role: "Frontend Developer",
      twitter: "https://x.com/Khushim1109",
      github: "https://github.com/Khushi256",
      initial: "K"
    }
  ];

  return (
    <div className="min-h-screen w-full bg-black overflow-x-hidden font-[Inter,sans-serif] relative">
      {/* Animated background gradients */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#016BFF] rounded-full filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4BBEBB] rounded-full filter blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Navbar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='bg-transparent relative z-10'
      >
        <Navbar />
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 px-6 sm:px-8 md:px-12 lg:px-20 py-12 md:py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto"
        >
          {/* Hero Section */}
          <motion.div variants={fadeInUp} className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-[#016BFF]/10 to-[#4BBEBB]/10 border border-[#4BBEBB]/30 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-[#4BBEBB]" />
              <span className="text-sm font-medium text-gray-300">AI-Powered Journal</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
              <span className="text-white">No Buttons—</span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]">
                Just Chat Naturally
              </span>
            </h1>

            <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              ReflectIQ autonomously decides what to do based on your conversation. 
              Talk like a friend—it automatically saves entries, creates goals, searches history, 
              and schedules events.
            </p>
          </motion.div>

          {/* What It Does */}
          <motion.div variants={fadeInUp} className="mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
              What It Does
            </h2>
            <div className="max-w-4xl space-y-3">
              {[
                "Saves journal entries when you share daily experiences",
                "Creates goals when you mention deadlines",
                "Searches past entries using semantic meaning",
                "Tracks goal progress by analyzing your journal",
                "Schedules Google Calendar events from natural language"
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={slideInLeft}
                  whileHover={{ x: 5 }}
                  className="flex items-start gap-3 p-4 rounded-lg bg-black/40 border border-[#4BBEBB]/10 hover:border-[#4BBEBB]/30 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#4BBEBB] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div variants={fadeInUp} className="mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
              Features
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ 
                    y: -5,
                    transition: { duration: 0.2 }
                  }}
                  className="p-6 rounded-xl bg-black/40 border border-[#4BBEBB]/20 hover:border-[#4BBEBB]/40 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* How It Works */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
            className="mb-20"
          >
            <motion.h2 variants={fadeInUp} className="text-2xl md:text-3xl font-bold text-white mb-8">
              How It Works
            </motion.h2>
            <div className="max-w-4xl">
              <div className="space-y-6">
                {[
                  { step: "1", title: "User Message", desc: "Start a conversation naturally" },
                  { step: "2", title: "WebSocket → Backend", desc: "Secure JWT authentication" },
                  { step: "3", title: "AI Agent (Gemini 2.5 Flash)", desc: "Analyzes user intent and selects appropriate tools" },
                  { step: "4", title: "Tool Execution", desc: "Save entry, search history, create goals, or add calendar events" },
                  { step: "5", title: "Streaming Response", desc: "Word-by-word typing effect in real-time" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    variants={slideInLeft}
                    whileHover={{ x: 5 }}
                    className="flex gap-4 items-start p-4 rounded-lg bg-black/40 border border-[#4BBEBB]/10 hover:border-[#4BBEBB]/30 transition-all"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#016BFF] to-[#4BBEBB] flex items-center justify-center text-black font-bold">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Usage Examples */}
          <motion.div variants={fadeInUp} className="mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
              Usage Examples
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {usageExamples.map((example, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-xl bg-black/40 border border-[#4BBEBB]/20"
                >
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#4BBEBB]" />
                    {example.title}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">You:</p>
                      <p className="text-gray-300 text-sm italic">"{example.user}"</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">AI:</p>
                      <p className="text-gray-400 text-sm">"{example.ai}"</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Tech Stack */}
          <motion.div variants={fadeInUp} className="mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
              Tech Stack
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {techStack.map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ x: 5 }}
                  className="p-5 rounded-xl bg-black/40 border border-[#4BBEBB]/20"
                >
                  <div className="flex items-start gap-3">
                    <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0 mt-0.5`} />
                    <div>
                      <span className="font-bold text-white">{item.category}:</span>
                      <p className="text-gray-400 text-sm mt-1">{item.tech}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Developers Section */}
<motion.div variants={fadeInUp} className="mb-20">
  <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-4">
    Meet the Team
  </h2>
  <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
    Built with passion by developers who believe in the power of AI-driven personal growth
  </p>
  <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
    {developers.map((dev, index) => (
      <motion.div
        key={index}
        variants={fadeInUp}
        whileHover={{ y: -5 }}
        className="p-6 rounded-xl bg-black/40 border border-[#4BBEBB]/20 hover:border-[#4BBEBB]/40 transition-all"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#016BFF] to-[#4BBEBB] flex items-center justify-center text-white font-bold text-2xl">
            {dev.initial}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{dev.name}</h3>
            <p className="text-sm text-gray-400">{dev.role}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <a
            href={dev.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 hover:text-white transition-all group"
          >
            <XIcon />
            
          </a>
          <a
            href={dev.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 hover:text-white transition-all group"
          >
            <Github className="w-4 h-4 group-hover:text-[#4BBEBB]" />
            
          </a>
        </div>
      </motion.div>
    ))}
  </div>
</motion.div>

          {/* CTA Section */}
          <motion.div variants={fadeInUp} className="text-center pb-8">
            <div className="inline-block p-10 rounded-2xl bg-gradient-to-br from-[#016BFF]/10 to-[#4BBEBB]/10 border border-[#4BBEBB]/30 backdrop-blur-sm">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Ready to Start Journaling?
              </h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                Experience autonomous AI journaling. No buttons, no commands—just natural conversation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => navigate('/auth')}
                    className="px-8 py-5 text-base font-bold border-none rounded-xl bg-gradient-to-r from-[#4BBEBB] to-[#016BFF] shadow-xl shadow-[#4BBEBB]/50 hover:shadow-[#4BBEBB]/70 transition-all duration-300 text-black hover:brightness-110 flex items-center gap-2"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => navigate('/')}
                    variant="outline"
                    className="px-8 py-5 text-base font-semibold rounded-xl border-2 border-[#4BBEBB]/40 bg-transparent text-gray-300 hover:bg-[#4BBEBB]/10 hover:border-[#4BBEBB]/60 hover:text-white transition-all duration-300"
                  >
                    Back to Home
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default About;
