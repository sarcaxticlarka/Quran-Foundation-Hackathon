import { create } from 'zustand';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'streak' | 'review' | 'halaqa' | 'general';
}

interface NotificationState {
  current: AppNotification | null;
  queue: AppNotification[];
  set: (n: AppNotification) => void;
  dismiss: () => void;
  enqueue: (n: AppNotification) => void;
  processNext: () => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  current: null,
  queue: [],

  set: (n) => set({ current: n }),

  dismiss: () => {
    const { queue } = get();
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      set({ current: next, queue: rest });
    } else {
      set({ current: null });
    }
  },

  enqueue: (n) => {
    const { current } = get();
    if (!current) {
      set({ current: n });
    } else {
      set((state) => ({ queue: [...state.queue, n] }));
    }
  },

  processNext: () => {
    const { queue } = get();
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      set({ current: next, queue: rest });
    }
  },
}));
