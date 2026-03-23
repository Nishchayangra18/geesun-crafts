import { RegisterOnboardingForm } from "@/components/auth/register-onboarding-form";

type RegisterPageProps = {
  searchParams?: Promise<{ step?: string; oauth?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = searchParams ? await searchParams : {};
  const step = Number(params.step);
  const oauthMode = params.oauth === "true";

  return <RegisterOnboardingForm initialStep={step} oauthMode={oauthMode} />;
}
