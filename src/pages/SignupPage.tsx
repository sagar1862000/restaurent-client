import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthForm } from "../components/auth/AuthForm";

export default function SignupPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/newUser");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold">Hotel Dastan</h1>
          <p className="text-muted-foreground mt-2">Create your account to get started</p>
        </motion.div>
        
        <AuthForm type="signup" onSuccess={handleSuccess} />
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button 
              onClick={() => navigate("/login")}
              className="text-primary font-medium hover:underline focus:outline-none"
            >
              Sign in
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
} 