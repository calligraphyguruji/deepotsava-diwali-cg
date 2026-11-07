import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
const App = lazy(() => import("./App"));
const FireworksPage = lazy(() => import("./fireworks/FireworksPage"));
export default function SiteRoutes() {
  const location = useLocation(),
    reduced = useReducedMotion();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduced ? {} : { opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Suspense
          fallback={
            <div className="route-loading" role="status">
              Opening a sky full of possibilities…
            </div>
          }
        >
          <Routes location={location}>
            <Route path="/" element={<App />} />
            <Route path="/fireworks" element={<FireworksPage />} />
            <Route
              path="*"
              element={
                <div className="route-loading">
                  <h1>Lost among the stars?</h1>
                  <Link to="/">Back to दीपोत्सव</Link>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
