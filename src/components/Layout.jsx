import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BottomTabBar from './BottomTabBar';

export default function Layout() {
  const location = useLocation();
  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
          style={{ height: '100%' }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <BottomTabBar />
    </>
  );
}