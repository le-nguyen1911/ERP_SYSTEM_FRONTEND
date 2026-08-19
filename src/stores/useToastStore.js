import { create } from 'zustand';

let nextId = 1;

export const useToastStore = create((set) => ({
  toasts: [],

  addToast: ({ title, message, type = 'info', duration = 4000 }) => {
    const id = nextId++;
    set((state) => ({
      toasts: [...state.toasts, { id, title, message, type }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  success: (message, title = 'Thành công') => {
    useToastStore.getState().addToast({ title, message, type: 'success' });
  },

  error: (message, title = 'Lỗi') => {
    useToastStore.getState().addToast({ title, message, type: 'error' });
  },

  warning: (message, title = 'Cảnh báo') => {
    useToastStore.getState().addToast({ title, message, type: 'warning' });
  },

  info: (message, title = 'Thông báo') => {
    useToastStore.getState().addToast({ title, message, type: 'info' });
  },
}));

export const toast = {
  success: (msg, title) => useToastStore.getState().success(msg, title),
  error: (msg, title) => useToastStore.getState().error(msg, title),
  warning: (msg, title) => useToastStore.getState().warning(msg, title),
  info: (msg, title) => useToastStore.getState().info(msg, title),
};
