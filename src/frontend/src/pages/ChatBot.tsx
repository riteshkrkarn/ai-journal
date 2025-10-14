import React, { useState, useEffect, useRef } from 'react';
import { Send, BookOpen, Search, Users, Calendar, User, Settings, Menu, X } from 'lucide-react';
import logoImg from '../assets/logo-img.png';

const Logo: React.FC = () => (
    <div className="flex items-center space-x-2">
        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#4BBEBB]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12.5 7.5C11.67 7.5 11 8.17 11 9V9.5C11 9.78 10.78 10 10.5 10H8C7.45 10 7 10.45 7 11C7 11.55 7.45 12 8 12H9C9.55 12 10 12.45 10 13V15C10 15.55 10.45 16 11 16C11.55 16 12 15.55 12 15V13C12 12.45 12.45 12 13 12H15C15.55 12 16 11.55 16 11C16 10.45 15.55 10 15 10H14C13.45 10 13 9.55 13 9V7.5C13 6.95 12.55 6.5 12 6.5C11.45 6.5 11 6.95 11 7.5V7.5Z" />
        </svg>
        <span className="text-base sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]">ReflectIQ</span>
    </div>
);

interface Message {
    id: number;
    text: string;
    isUser: boolean;
    timestamp: string;
    isTyping?: boolean;
}

const ChatBot: React.FC = () => {
    const [inputMessage, setInputMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed on mobile
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-open sidebar on desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
            }
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const simulateTyping = (text: string, messageId: number) => {
        let currentText = '';
        const words = text.split(' ');
        let wordIndex = 0;

        const typingInterval = setInterval(() => {
            if (wordIndex < words.length) {
                currentText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === messageId
                            ? { ...msg, text: currentText, isTyping: true }
                            : msg
                    )
                );
                wordIndex++;
            } else {
                clearInterval(typingInterval);
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === messageId
                            ? { ...msg, isTyping: false }
                            : msg
                    )
                );
            }
        }, 50);
    };

    const handleSendMessage = () => {
        if (inputMessage.trim() === '') return;

        const newMessage: Message = {
            id: messages.length + 1,
            text: inputMessage,
            isUser: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages([...messages, newMessage]);
        setInputMessage('');

        // Simulate AI response with typing effect
        setTimeout(() => {
            const aiMessageId = messages.length + 2;
            const aiMessage: Message = {
                id: aiMessageId,
                text: '',
                isUser: false,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isTyping: true
            };
            setMessages(prev => [...prev, aiMessage]);

            const responseText = "I'm processing your request. This is a demo response showing how I would help you with your journal entries. I can search through your past entries, create summaries, track your goals, and provide insights about your personal growth journey.";
            simulateTyping(responseText, aiMessageId);
        }, 500);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="h-screen w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex font-['Inter',sans-serif] overflow-hidden">
            
            {/* Left Sidebar - Fixed with overlay on mobile */}
            <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 sm:w-72 md:w-64 bg-[#1a1a1a]/95 md:bg-[#1a1a1a]/80 backdrop-blur-xl border-r border-gray-800/50 flex flex-col transition-transform duration-300 overflow-hidden`}>
                {/* Logo */}
                <div className="p-3 sm:p-4 border-b border-gray-800/50">
                    <Logo />
                    <p className="text-xs sm:text-sm mt-1 bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]">Your AI Journal & Assistant</p>
                </div>

                {/* Navigation */}
                <div className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
                    <button className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#016BFF]/10 to-[#4BBEBB]/10 border border-[#4BBEBB]/30 hover:border-[#4BBEBB]/50 transition-all">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#4BBEBB] flex-shrink-0" />
                        <span className="text-sm sm:text-base font-medium bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] truncate">Journal / Chat</span>
                    </button>

                    <button className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl hover:bg-gray-800/50 transition-all group">
                        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-[#4BBEBB] flex-shrink-0" />
                        <span className="text-sm sm:text-base font-medium text-gray-400 group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#016BFF] group-hover:to-[#4BBEBB] truncate">Goals</span>
                    </button>

                    <button className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl hover:bg-gray-800/50 transition-all group">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-[#4BBEBB] flex-shrink-0" />
                        <span className="text-sm sm:text-base font-medium text-gray-400 group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#016BFF] group-hover:to-[#4BBEBB] truncate">Team</span>
                    </button>

                    <button className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl hover:bg-gray-800/50 transition-all group">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-[#4BBEBB] flex-shrink-0" />
                        <span className="text-sm sm:text-base font-medium text-gray-400 group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#016BFF] group-hover:to-[#4BBEBB] truncate">Calendar</span>
                    </button>
                </div>

                {/* Profile and Settings at Bottom */}
                <div className="p-3 sm:p-4 border-t border-gray-800/50 space-y-1 sm:space-y-2">
                    <button className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl hover:bg-gray-800/50 transition-all group">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-[#4BBEBB] flex-shrink-0" />
                        <span className="text-sm sm:text-base font-medium text-gray-400 group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#016BFF] group-hover:to-[#4BBEBB] truncate">Profile</span>
                    </button>
                    <button className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl hover:bg-gray-800/50 transition-all group">
                        <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-[#4BBEBB] flex-shrink-0" />
                        <span className="text-sm sm:text-base font-medium text-gray-400 group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#016BFF] group-hover:to-[#4BBEBB] truncate">Settings</span>
                    </button>
                </div>
            </div>

            {/* Overlay for mobile when sidebar is open */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col w-full md:w-auto">
                
                {/* Header */}
                <div className="h-14 sm:h-16 bg-[#1a1a1a]/60 backdrop-blur-xl border-b border-gray-800/50 flex items-center justify-between px-3 sm:px-6">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="text-gray-400 hover:text-white transition-colors p-1.5 sm:p-2 hover:bg-gray-800/50 rounded-lg"
                        >
                            {isSidebarOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
                        </button>
                        <h1 className="text-base sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] md:hidden">
                            ReflectIQ
                        </h1>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-3 sm:p-4 md:p-6">
                    {messages.length === 0 ? (
                        
                        <div className="text-center max-w-2xl px-4">
                            <div className="mb-4 sm:mb-6">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                                    <img src={logoImg} alt="logo" className="w-10 h-10 sm:w-12 sm:h-12" />
                                </div>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2 sm:mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]">
                                    Welcome to ReflectIQ
                                </h1>
                                <p className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#4BBEBB] to-[#016BFF]">
                                    Your AI Journal & Assistant
                                </p>
                                <p className="text-gray-400 text-sm sm:text-base">
                                    How can I help you today?
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Messages */
                        <div className="w-full max-w-3xl space-y-4 sm:space-y-6">
                            {messages.map((message) => (
                                <div 
                                    key={message.id} 
                                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[90%] sm:max-w-[85%] ${message.isUser ? 'ml-4 sm:ml-12' : 'mr-4 sm:mr-12'}`}>
                                        {!message.isUser && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" />
                                                    </svg>
                                                </div>
                                                <span className="text-xs font-medium text-gray-500">ReflectIQ</span>
                                            </div>
                                        )}
                                        <div 
                                            className={`rounded-2xl p-3 sm:p-4 ${
                                                message.isUser 
                                                    ? 'bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] text-white' 
                                                    : 'bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 text-white'
                                            }`}
                                        >
                                            <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                                                {message.text}
                                                {message.isTyping && (
                                                    <span className="inline-block w-0.5 h-3 sm:h-4 bg-[#4BBEBB] ml-1 animate-pulse"></span>
                                                )}
                                            </p>
                                        </div>
                                        <p className={`text-xs text-gray-600 mt-1 ${message.isUser ? 'text-right' : 'text-left'}`}>
                                            {message.timestamp}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border-t border-gray-800/50 p-3 sm:p-4 md:p-6">
                    <div className="max-w-4xl mx-auto flex gap-2 sm:gap-3">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Message ReflectIQ..."
                            className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4BBEBB]/50 focus:border-transparent transition-all"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim()}
                            className="bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2 flex-shrink-0"
                        >
                            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;