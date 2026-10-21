/** The current time in ms. A named function so render code reads the clock in one place (lint: react-hooks/purity). */
export const nowMs = (): number => Date.now();
