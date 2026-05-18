// Module-level flag: false on every hard refresh (module re-evaluates),
// true once the splash has fired in this session. Client-side navigations
// don't re-evaluate modules, so back-navigation correctly skips the wait.
let _done = false;

export const splashIsDone = () => _done;

export const signalSplashDone = () => {
  _done = true;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("splash-done"));
  }
};
