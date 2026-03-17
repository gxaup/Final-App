import { CreateSessionForm } from "@/components/CreateSessionForm";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 safe-area-top safe-area-bottom">
      <div className="w-full max-w-lg">
        <div className="mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-10 -ml-2" data-testid="button-back">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <div className="text-center mb-6 space-y-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display text-foreground">
            New Report
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Enter session details to begin
          </p>
        </div>
        
        <CreateSessionForm />
      </div>
    </div>
  );
}
