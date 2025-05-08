import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react"

export default function Header() {
  const iptRef = useRef<HTMLInputElement>(null)
  const [iptValue, setIptValue] = useState("")

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setIptValue(e.currentTarget.value)

    window.postMessage({
      source: "moda-main-input",
      paylod: {
        value: e.currentTarget.value,
      }
    }, "*")
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "/") {
      e.preventDefault()
      iptRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <header className="flex justify-between gap-2 p-2 text-stone-200">
      <Input
        ref={iptRef}
        value={iptValue}
        onChange={e => handleChange(e)}
        placeholder={`Press "/" to search...`}
      />
    </header>
  );
}
