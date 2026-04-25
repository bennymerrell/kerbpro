import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BottomTabBar from './BottomTabBar';

export default function Layout() {
  const location = useLocation();
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomTabBar />
    </div>
  );
}