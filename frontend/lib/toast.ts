import toast from 'react-hot-toast';

export const toastError = (err: any, fallbackMessage: string = 'An error occurred') => {
    console.error(err);
    toast.error(err?.message || fallbackMessage);
};
