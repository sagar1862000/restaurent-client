import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useAuth } from "../../lib/AuthContext";
import { authApi } from "../../lib/api/user";
import { useNavigate } from "react-router-dom";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Form validation schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

interface AuthFormProps {
  type: "login" | "signup";
  onSuccess?: () => void;
}

export function AuthForm({ type, onSuccess }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isLogin = type === "login";
  const schema = isLogin ? loginSchema : signupSchema;

  const form = useForm<LoginFormValues | SignupFormValues>({
    resolver: zodResolver(schema),
    defaultValues: isLogin
      ? { email: "", password: "" }
      : { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: LoginFormValues | SignupFormValues) => {
    setIsLoading(true);
    try {
      if (isLogin) {
        const { token, user } = await authApi.login(
          (values as LoginFormValues).email,
          (values as LoginFormValues).password
        );
        login(token, user.role);
        toast.success(`Welcome back, ${user.name}!`);
        if (onSuccess) onSuccess();
      } else {
        const { token, user } = await authApi.signup(
          (values as SignupFormValues).name,
          (values as SignupFormValues).email,
          (values as SignupFormValues).password
        );
        login(token);
        toast.success(`Account created successfully. Welcome, ${user.name}!`);
        debugger;
        // Use setTimeout to ensure this navigation happens after any redirects in login()
        setTimeout(() => {
          navigate("/newUser");
        }, 100);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error.message === "User has not been assigned a role") {
        toast.error(
          "Your account is pending role assignment. Please contact an administrator."
        );
        navigate("/newUser");
      } else {
        toast.error(
          isLogin
            ? "Login failed. Please check your credentials."
            : "Signup failed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const inputVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.1, duration: 0.3 },
    }),
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={formVariants}>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin
              ? "Enter your credentials to access your account"
              : "Fill in your details to create a new account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!isLogin && (
                <motion.div
                  custom={0}
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}

              <motion.div
                custom={isLogin ? 0 : 1}
                variants={inputVariants}
                initial="hidden"
                animate="visible"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="name@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div
                custom={isLogin ? 1 : 2}
                variants={inputVariants}
                initial="hidden"
                animate="visible"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              {!isLogin && (
                <motion.div
                  custom={3}
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}

              <motion.div
                className="pt-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLogin ? "Sign In" : "Create Account"}
                </Button>
              </motion.div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
