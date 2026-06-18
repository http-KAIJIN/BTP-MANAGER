"use client";

import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/ui-kit/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const languages = [
  { code: "ar", title: "Darija", description: "Interface actuelle en darija marocaine." },
  { code: "fr", title: "Français", description: "Interface professionnelle en français." },
  { code: "en", title: "English", description: "Professional English interface." },
];

export default function LanguageSettingsPage() {
  const { user, updateLanguage } = useAuth();
  const { dict } = useI18n();

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.language.title} subtitle="Language is saved per user. Each account can use a different interface language." />
      <div className="grid gap-4 md:grid-cols-3">
        {languages.map((language) => {
          const active = (user?.preferredLanguage ?? "ar") === language.code;
          return (
            <Card key={language.code} className={active ? "border-primary shadow-sm" : ""}>
              <CardContent className="space-y-4 p-5">
                <div>
                  <h3 className="text-lg font-semibold">{language.title}</h3>
                  <p className="text-sm text-muted-foreground">{language.description}</p>
                </div>
                <Button type="button" variant={active ? "default" : "outline"} onClick={() => updateLanguage(language.code)} className="w-full">
                  {active ? "Active" : dict.language.switchTo}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
