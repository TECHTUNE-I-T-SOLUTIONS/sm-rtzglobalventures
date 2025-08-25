"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-black p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="max-w-3xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden"
      >
        <div className="relative p-8 sm:p-12 flex flex-col items-center text-center">
          <div className="absolute -left-32 -top-20 opacity-10 pointer-events-none blur-3xl">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
              className="w-64 h-64 bg-gradient-to-br from-primary to-green-300 rounded-full"
            />
          </div>

          <Image src="/logo.png" alt="App Logo" width={96} height={96} className="rounded-full" />

          <h1 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">404 — Page not found</h1>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 max-w-xl">
            Looks like you wandered into the void. We couldn't find that page.
          </p>

          <blockquote className="mt-6 italic text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md max-w-xl">
            "I asked the server for directions. It replied: '404 — I have no idea.'"
          </blockquote>

          <div className="mt-6 flex gap-3">
            <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white hover:opacity-95">
              Take me home
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200"
            >
              Browse homepage
            </Link>
          </div>

          <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
            Tip: Double-check the URL or head back to safety — we didn't mean to hide anything permanently.
          </div>
        </div>
      </motion.div>
    </div>
  )
}
