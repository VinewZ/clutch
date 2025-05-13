import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
export function SelectLanguage() {
  const languages = ["english", "portuguese"];
  const [currentLang, setCurrentLang] = useState(languages[0]);

  useEffect(() => {
    console.log(currentLang);
  }, [currentLang]);

  return (
    <Select defaultValue={currentLang} onValueChange={setCurrentLang}>
      <SelectTrigger className="ml-auto cursor-pointer capitalize">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem
            key={lang}
            className="cursor-pointer capitalize"
            value={lang}
          >
            {lang}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
