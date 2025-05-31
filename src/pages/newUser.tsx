import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle2, LogIn } from "lucide-react";

export default function NewUserPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-accent/10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8"
      >
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center"
          >
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome to SkyBar Cafe & Lounge!
            </h1>
            <p className="text-muted-foreground">
              Your account has been created successfully. Please wait while our administrator assigns you a role.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Once your role is assigned, you'll be able to access the system with your credentials.
                We'll notify you when your account is ready.
              </p>
            </div>

            <Button
              onClick={() => navigate("/login")}
              className="w-full"
              size="lg"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Go to Login
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
