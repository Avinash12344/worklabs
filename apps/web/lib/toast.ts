'use client';

import toast from 'react-hot-toast';

export function showSuccess(message: string) {
  toast.success(message, {
    duration: 3000,
  });
}

export function showError(message: string) {
  toast.error(message, {
    duration: 5000,
  });
}

export function showInfo(message: string) {
  toast(message, {
    icon: 'ℹ️',
    duration: 3000,
  });
}

export function showLoading(message: string) {
  return toast.loading(message);
}

export function dismiss(id?: string) {
  toast.dismiss(id);
}