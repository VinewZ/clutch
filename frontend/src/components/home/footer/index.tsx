import { ArrowDown, ArrowUp } from "lucide-react";
import { Kbd } from "@/components/kbd"

export function Footer() {
  return (
    <footer className="h-[35px] w-full flex items-center justify-between border-t px-2">
      <div>Clutch</div>
      <div className='flex gap-1'>
        <div className='flex gap-1 items-center'>
          <span className='text-xs'>Press</span>
          <Kbd className='static'>/</Kbd>
          <span className='text-xs'>to focus input and </span>
        </div>
        <div className='flex gap-1 items-center'>
          <Kbd className='static'><ArrowDown size={14} /></Kbd>
          <Kbd className='static'><ArrowUp size={14} /></Kbd>
          <span className='text-xs'>to navigate the list</span>
        </div>
      </div>
    </footer>
  )
}
