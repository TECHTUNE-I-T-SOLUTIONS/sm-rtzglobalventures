"use client"

import Image from "next/image"
import { useState } from "react"
import { motion } from "framer-motion"

interface ErrorProps {
  error: Error
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const [showLog, setShowLog] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-black p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
      >
        <div className="p-8 sm:p-12 text-center">
          <motion.div whileHover={{ scale: 1.05 }} className="mx-auto w-24 h-24 rounded-full overflow-hidden">
            <Image src="/logo.png" alt="App Logo" width={96} height={96} />
          </motion.div>

          <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">We're working on it — our engineers have been notified.</p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setShowLog((s) => !s)
              }}
              className="px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200"
            >
              {showLog ? "Hide error log" : "Show error log"}
            </button>

            <button
              onClick={() => reset()}
              className="px-4 py-2 rounded-md bg-primary text-white text-sm"
            >
              Try again
            </button>
          </div>

          {showLog && (
            <pre className="mt-6 text-xs text-left bg-gray-50 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-64 text-red-600 dark:text-red-300">
              {String(error?.message)}
              {error?.stack ? "\n\n" + error.stack : ""}
            </pre>
          )}

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">If this persists, please contact support and include the error log above.</p>
        </div>
      </motion.div>
    </div>
  )
}
