import { createFileRoute } from '@tanstack/react-router'
import { MainInput } from '../-components/main_input'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BackButton } from '@/components/back_button'
import { useLocalStorage } from '@uidotdev/usehooks'
import type { MathHistoryT } from '../-components/converter_container'
import { HelpDialog } from '../-components/help_dialog'
import { Kbd } from '@/components/kbd'
import { ArrowDown, ArrowUp, Clipboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'react-toastify'

export const Route = createFileRoute('/math-history/')({
  component: RouteComponent,
})

function RouteComponent() {
  const ref = useRef<HTMLInputElement>(null)
  const [filter, setFilter] = useState('')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [mathHistory] = useLocalStorage<MathHistoryT[]>('clutch-math-history', [])
  const filteredHistory = mathHistory.filter(item => {
    return item.input.toLowerCase().includes(filter.toLowerCase()) ||
      item.result.toLowerCase().includes(filter.toLowerCase())
  })
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false)

  const navigateHistory = useCallback((key: string) => {
    if (mathHistory.length === 0) return

    setSelectedIdx(prev => {
      if (key === 'ArrowDown') {
        if (prev == null) return 0
        return Math.min(prev + 1, mathHistory.length - 1)
      }
      if (key === 'ArrowUp') {
        if (prev == null) return mathHistory.length - 1
        return Math.max(prev - 1, 0)
      }
      return prev
    })
  }, [mathHistory.length])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        navigateHistory(e.key)
        break

      case 'Enter':
        if (selectedIdx != null) {
          try {
            navigator.clipboard.writeText(mathHistory[selectedIdx].result)
            toast.success("Copied to clipboard")
          } catch (e) {
            toast.error("Couldn't copy to clipboard")
          }
        }
        break

      default:
        break
    }
  }, [navigateHistory, selectedIdx, mathHistory])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  useEffect(() => {
    ref.current?.focus()
  }, [])


  useEffect(() => {
    if (filter === '') {
      setSelectedIdx(null)
    }

    if (filter.length > 0) {
      setSelectedIdx(0)
    }
  }, [filter])


  return (
    <div className='mt-[55px] h-[550px]'>
      <BackButton />
      <MainInput
        inputRef={ref}
        value={filter}
        setValue={setFilter}
        placeholder='Filter'
        className='pl-14'
      />
      <div>
        {
          filteredHistory.length === 0 && (

            <div className='grid place-content-center w-full h-[550px]'>
              <span className='text-zinc-500 text-sm'>No history found</span>
            </div>
          )
        }
        {
          filteredHistory.map((value, idx) => (
            <div className={cn(
              "mx-1 flex cursor-pointer items-center justify-between gap-2 rounded p-2 text-sm relative",
              selectedIdx === idx ? "bg-zinc-700" : "text-zinc-300",
            )} >
              <span>
                {value.input}
              </span>
              <span className='flex gap-4 items-center'>
                {value.result}
                <Clipboard size={16} />
              </span>
            </div>
          ))
        }
      </div>

      <HelpDialog isOpen={isHelpDialogOpen} setIsOpen={setIsHelpDialogOpen} title="Keybindings">
        <div className="flex items-center gap-1">
          <span>Press</span>
          <Kbd>/</Kbd>
          <span>to focus input</span>
        </div>

        <div className="flex items-center gap-1">
          <span>Press</span>
          <Kbd>
            <ArrowUp size={12} />
          </Kbd>
          <Kbd>
            <ArrowDown size={12} />
          </Kbd>
          <span>to navigate list</span>
        </div>

        <div className="flex items-center gap-1">
          <span>Press</span>
          <Kbd>RETURN</Kbd>
          <span>to copy to clipboard</span>
        </div>
      </HelpDialog>

    </div>
  )
}
