import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { login, register } from "../utils/auth";


// Types for form data
type SigninFormData = {
  email: string;
  password: string;
};


type SignupFormData = {
  email: string;
  password: string;
  confirmPassword: string;
};


const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSignin, setIsSignin] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  // Separate forms for signin and signup
  const signinForm = useForm<SigninFormData>();
  const signupForm = useForm<SignupFormData>();


  const onSigninSubmit: SubmitHandler<SigninFormData> = async (data) => {
    setError("");
    setLoading(true);


    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };


  const onSignupSubmit: SubmitHandler<SignupFormData> = async (data) => {
    setError("");
    setLoading(true);


    try {
      // Use email username as fullName for simplicity
      const fullName = data.email.split("@")[0];
      await register(data.email, data.password, fullName);
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };


  const toggleAuthMode = (mode: "signin" | "signup") => {
    setIsSignin(mode === "signin");
    // Reset forms when switching modes
    signinForm.reset();
    signupForm.reset();
  };


  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-950 p-4 sm:p-6 lg:p-8 font-['Inter',sans-serif]">
      <div className="w-full max-w-md bg-[#121212] p-8 sm:p-10 rounded-3xl shadow-2xl shadow-[#4BBEBB]/20 border border-gray-800">
        <div className="flex justify-center mb-6">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <svg
              className="w-8 h-8 text-[#4BBEBB]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12.5 7.5C11.67 7.5 11 8.17 11 9V9.5C11 9.78 10.78 10 10.5 10H8C7.45 10 7 10.45 7 11C7 11.55 7.45 12 8 12H9C9.55 12 10 12.45 10 13V15C10 15.55 10.45 16 11 16C11.55 16 12 15.55 12 15V13C12 12.45 12.45 12 13 12H15C15.55 12 16 11.55 16 11C16 10.45 15.55 10 15 10H14C13.45 10 13 9.55 13 9V7.5C13 6.95 12.55 6.5 12 6.5C11.45 6.5 11 6.95 11 7.5V7.5Z" />
            </svg>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]">
              ReflectIQ
            </span>
          </div>
        </div>


        <h1
          className="
                    text-4xl font-extrabold text-center mb-10 
                    bg-clip-text text-transparent 
                    bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]
                "
        >
          {isSignin ? "Welcome Back" : "Create Your Account"}
        </h1>


        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500 text-red-300 text-sm">
            {error}
          </div>
        )}


        <div className="flex mb-8 bg-gray-800 p-1 rounded-xl shadow-inner shadow-gray-900/50">
          <button
            type="button"
            onClick={() => toggleAuthMode("signin")}
            className={`w-1/2 py-2 text-md font-semibold rounded-lg transition-all duration-300 ${
              isSignin
                ? "bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] text-black shadow-md shadow-cyan-500/30"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => toggleAuthMode("signup")}
            className={`w-1/2 py-2 text-md font-semibold rounded-lg transition-all duration-300 ${
              !isSignin
                ? "bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] text-black shadow-md shadow-cyan-500/30"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            Sign Up
          </button>
        </div>


        {/* Signin Form */}
        {isSignin ? (
          <form
            onSubmit={signinForm.handleSubmit(onSigninSubmit)}
            className="space-y-5"
          >
            {/* Email Input */}
            <div>
              <input
                type="email"
                placeholder="Email Address"
                aria-label="Email Address"
                {...signinForm.register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4BBEBB] focus:border-transparent outline-none transition duration-200 shadow-inner"
              />
              {signinForm.formState.errors.email && (
                <p className="text-red-400 text-sm mt-1">
                  {signinForm.formState.errors.email.message}
                </p>
              )}
            </div>


            {/* Password Input */}
            <div>
              <input
                type="password"
                placeholder="Password"
                aria-label="Password"
                {...signinForm.register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4BBEBB] focus:border-transparent outline-none transition duration-200 shadow-inner"
              />
              {signinForm.formState.errors.password && (
                <p className="text-red-400 text-sm mt-1">
                  {signinForm.formState.errors.password.message}
                </p>
              )}
            </div>


            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="
                                w-full py-3 mt-6 text-xl font-extrabold text-black 
                                bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]
                                shadow-xl shadow-cyan-500/30 
                                hover:shadow-cyan-400/50 
                                transition-all duration-300 hover:scale-[1.01]
                                rounded-lg
                                disabled:opacity-50 disabled:cursor-not-allowed
                            "
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        ) : (
          /* Signup Form */
          <form
            onSubmit={signupForm.handleSubmit(onSignupSubmit)}
            className="space-y-5"
          >
            {/* Email Input */}
            <div>
              <input
                type="email"
                placeholder="Email Address"
                aria-label="Email Address"
                {...signupForm.register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4BBEBB] focus:border-transparent outline-none transition duration-200 shadow-inner"
              />
              {signupForm.formState.errors.email && (
                <p className="text-red-400 text-sm mt-1">
                  {signupForm.formState.errors.email.message}
                </p>
              )}
            </div>


            {/* Password Input */}
            <div>
              <input
                type="password"
                placeholder="Password"
                aria-label="Password"
                {...signupForm.register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4BBEBB] focus:border-transparent outline-none transition duration-200 shadow-inner"
              />
              {signupForm.formState.errors.password && (
                <p className="text-red-400 text-sm mt-1">
                  {signupForm.formState.errors.password.message}
                </p>
              )}
            </div>


            {/* Confirm Password */}
            <div>
              <input
                type="password"
                placeholder="Confirm Password"
                aria-label="Confirm Password"
                {...signupForm.register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value: string) => {
                    const { password } = signupForm.getValues();
                    return value === password || "Passwords do not match";
                  },
                })}
                className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4BBEBB] focus:border-transparent outline-none transition duration-200 shadow-inner"
              />
              {signupForm.formState.errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">
                  {signupForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>


            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="
                                w-full py-3 mt-6 text-xl font-extrabold text-black 
                                bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]
                                shadow-xl shadow-cyan-500/30 
                                hover:shadow-cyan-400/50 
                                transition-all duration-300 hover:scale-[1.01]
                                rounded-lg
                                disabled:opacity-50 disabled:cursor-not-allowed
                            "
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>
        )}


        <p className="text-center text-sm mt-6 text-gray-500">
          {isSignin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setIsSignin(!isSignin)}
            className="text-[#4BBEBB] font-medium hover:text-cyan-400 transition-colors"
          >
            {isSignin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};


export default AuthPage;
