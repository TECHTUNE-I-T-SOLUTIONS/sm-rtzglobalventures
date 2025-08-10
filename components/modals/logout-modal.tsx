
"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ConfirmationModal, ConfirmationModalProps } from "@/components/ui/confirmation-modal"

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function LogoutModal({ isOpen, onClose, onConfirm, ...props }: LogoutModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted || !isOpen) return null

  const modalRoot = document.getElementById("modal-root")

  if (!modalRoot) {
    console.error("Modal root element not found. Make sure a div with id='modal-root' exists in your DOM.")
    return null
  }

  return createPortal(
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      {...props}
    />,
    modalRoot
  )
}
