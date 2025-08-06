"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface VerificationInputProps {
  length?: number
  onComplete?: (code: string) => void
  onCodeChange?: (code: string) => void
  disabled?: boolean
  className?: string
}

export function VerificationInput({
  length = 6,
  onComplete,
  onCodeChange,
  disabled = false,
  className
}: VerificationInputProps) {
  const [code, setCode] = useState<string[]>(new Array(length).fill(''))
  const [focusedIndex, setFocusedIndex] = useState<number>(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Initialize refs array
    inputRefs.current = inputRefs.current.slice(0, length)
  }, [length])

  const handleCodeChange = (newCode: string[]) => {
    setCode(newCode)
    const codeString = newCode.join('')
    onCodeChange?.(codeString)
    
    if (codeString.length === length) {
      onComplete?.(codeString)
    }
  }

  const handleInputChange = (index: number, value: string) => {
    if (disabled) return

    // Only allow single digits
    if (value.length > 1) {
      value = value.slice(-1)
    }

    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      return
    }

    const newCode = [...code]
    newCode[index] = value
    handleCodeChange(newCode)

    // Auto-focus next input
    if (value && index < length - 1) {
      setFocusedIndex(index + 1)
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (e.key === 'Backspace') {
      if (code[index]) {
        // Clear current input
        const newCode = [...code]
        newCode[index] = ''
        handleCodeChange(newCode)
      } else if (index > 0) {
        // Move to previous input
        setFocusedIndex(index - 1)
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setFocusedIndex(index - 1)
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      setFocusedIndex(index + 1)
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return

    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length)
    
    if (pastedData.length > 0) {
      const newCode = [...code]
      for (let i = 0; i < length; i++) {
        newCode[i] = pastedData[i] || ''
      }
      handleCodeChange(newCode)
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(pastedData.length, length - 1)
      setFocusedIndex(nextIndex)
      inputRefs.current[nextIndex]?.focus()
    }
  }

  const handleFocus = (index: number) => {
    setFocusedIndex(index)
  }

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {code.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={cn(
            "w-12 h-12 text-center text-lg font-mono border-2 transition-all duration-200",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            digit && "border-green-500 bg-green-50 dark:bg-green-950",
            focusedIndex === index && "border-primary ring-2 ring-primary/20",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            letterSpacing: '0.1em'
          }}
        />
      ))}
    </div>
  )
} 