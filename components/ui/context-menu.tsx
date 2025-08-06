'use client'

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export interface MenuItem {
  label: string;
  href?: string;
  action?: () => void;
  isSeparator?: boolean;
}

interface ContextMenuProps {
  items: MenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ items, x, y, onClose }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        style={{ top: y, left: x }}
        className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-1"
        onMouseLeave={onClose}
      >
        {items.map((item, index) => {
          if (item.isSeparator) {
            return <div key={index} className="h-px my-1 bg-gray-200 dark:bg-gray-700" />;
          }

          const content = (
            <span className="flex items-center px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
              {item.label}
            </span>
          );

          if (item.href) {
            return (
              <Link href={item.href} key={index} onClick={onClose}>
                {content}
              </Link>
            );
          }

          return (
            <button key={index} onClick={() => { item.action?.(); onClose(); }} className="w-full text-left">
              {content}
            </button>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
};