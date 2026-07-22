import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, Topbar } from './Layout';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarWidth = collapsed ? 80 : 260;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <motion.div 
        layout
        initial={false}
        animate={{ marginLeft: sidebarWidth }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: `calc(100% - ${sidebarWidth}px)`,
        }}
      >
        <Topbar sidebarCollapsed={collapsed} onMobileMenu={() => setMobileOpen(o => !o)} />
        <main style={{ flex: 1, padding: '2rem', overflowX: 'hidden', position: 'relative' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key="main-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ minHeight: '100%' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

      </motion.div>
    </div>
  );
}
