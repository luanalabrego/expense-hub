import { useState, useRef, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

export const useConfirm = () => {
  const [open, setOpen] = useState(false);
  const resolveRef = useRef(null);
  const messageRef = useRef('');

  const confirm = useCallback((message) => {
    messageRef.current = message;
    setOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleCancel = () => {
    setOpen(false);
    resolveRef.current?.(false);
  };

  const handleConfirm = () => {
    setOpen(false);
    resolveRef.current?.(true);
  };

  const ConfirmationDialog = () => (
    <AlertDialog open={open} onOpenChange={(o) => !o && handleCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmação</AlertDialogTitle>
          <AlertDialogDescription>{messageRef.current}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, ConfirmationDialog };
};

export default useConfirm;
