import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { LogIn } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login(data.username);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Login failed";
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col p-4 safe-area-bottom safe-area-top">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 space-y-2">
            <h1 className="text-3xl font-extrabold font-display text-foreground">
              Full Loop Report
            </h1>
            <p className="text-base text-muted-foreground">
              Enter your username to continue
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name:</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Enter your name"
                        className="h-12 text-base"
                        autoComplete="username"
                        autoFocus
                        data-testid="input-username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold bg-white text-black hover:bg-white/90 hover-lift"
                disabled={isSubmitting}
                data-testid="button-login"
              >
                {isSubmitting ? (
                  <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Continue
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
