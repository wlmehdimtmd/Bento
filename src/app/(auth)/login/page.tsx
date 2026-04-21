import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { LoginForm } from "@/components/auth/LoginForm";
import { AppBrandMark } from "@/components/layout/AppBrandMark";

export async function generateMetadata() {
  return {
    title: "Log in — Bento Resto",
  };
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-md space-y-2">
      <Link
        href="/"
        aria-label="Back to home"
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <Card className="shadow-lg">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="flex justify-center mb-4">
            <AppBrandMark variant="auth" />
          </div>
          <CardTitle className="text-2xl">Welcome back!</CardTitle>
          <CardDescription>
            Log in to manage your business.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
