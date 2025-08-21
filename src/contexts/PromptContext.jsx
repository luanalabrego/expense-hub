import { createContext, useContext, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

const PromptContext = createContext(null);

export const PromptProvider = ({ children }) => {
  const [state, setState] = useState({ open: false, title: '', resolve: () => {} });
  const [value, setValue] = useState('');

  const prompt = ({ title }) =>
    new Promise((resolve) => {
      setState({ open: true, title, resolve });
      setValue('');
    });

  const handleCancel = () => {
    state.resolve(null);
    setState((s) => ({ ...s, open: false, resolve: () => {} }));
  };

  const handleConfirm = () => {
    state.resolve(value);
    setState((s) => ({ ...s, open: false, resolve: () => {} }));
  };

  return (
    <PromptContext.Provider value={prompt}>
      {children}
      <AlertDialog open={state.open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{state.title}</AlertDialogTitle>
          </AlertDialogHeader>
          <Input value={value} onChange={(e) => setValue(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PromptContext.Provider>
  );
};

export const usePrompt = () => {
  const ctx = useContext(PromptContext);
  if (!ctx) throw new Error('usePrompt must be used within PromptProvider');
  return ctx;
};

