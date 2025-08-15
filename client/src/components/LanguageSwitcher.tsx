import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

const languages = [
  { code: 'en', label: '🇺🇸 EN', name: 'English' },
  { code: 'ru', label: '🇷🇺 RU', name: 'Русский' },
  { code: 'es', label: '🇪🇸 ES', name: 'Español' },
  { code: 'zh', label: '🇨🇳 ZH', name: '中文' },
  { code: 'ar', label: '🇸🇦 AR', name: 'العربية' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    i18n.changeLanguage(languageCode);
    localStorage.setItem('showpls-language', languageCode);
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <Select value={currentLanguage} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-auto bg-panel border-brand-primary/30 text-text-primary">
        <SelectValue>
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">{currentLang.label}</span>
            <span className="sm:hidden">{currentLang.label.split(' ')[0]}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-panel border-brand-primary/30">
        {languages.map((language) => (
          <SelectItem 
            key={language.code} 
            value={language.code}
            className="text-text-primary focus:bg-brand-primary/20 focus:text-text-primary cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <span>{language.label}</span>
              <span className="text-text-muted text-sm">({language.name})</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
