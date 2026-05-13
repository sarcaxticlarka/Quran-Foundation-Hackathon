export const Durations = {
  instant: 100,
  fast: 200,
  normal: 350,
  slow: 500,
  verySlow: 800,
};

export const Springs = {
  default: {
    damping: 15,
    stiffness: 200,
    mass: 1,
  },
  bouncy: {
    damping: 10,
    stiffness: 250,
    mass: 0.8,
  },
  gentle: {
    damping: 20,
    stiffness: 150,
    mass: 1.2,
  },
  snappy: {
    damping: 25,
    stiffness: 400,
    mass: 0.7,
  },
};

export const Easings = {
  easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  easeOut: [0.0, 0, 0.2, 1] as [number, number, number, number],
  easeIn: [0.4, 0, 1, 1] as [number, number, number, number],
  sharp: [0.4, 0, 0.6, 1] as [number, number, number, number],
};
