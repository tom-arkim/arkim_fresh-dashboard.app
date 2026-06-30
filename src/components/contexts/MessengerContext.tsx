import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { Messenger } from '../common/Messenger';
import { Info, XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import MessengerService from '../../services/ui/messengerService';
import { toast, Toaster } from 'sonner';
import { useTheme } from '@/components/contexts/ThemeContext';

// Define message types
export type MessageType = 'info' | 'error' | 'warning' | 'success' | 'confirm';

interface MessengerContextType {
  showMessage: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showConfirm: (
    message: string,
    title?: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmButtonText?: string,
    cancelButtonText?: string
  ) => void;
}

const MessengerContext = createContext<MessengerContextType | null>(null);

export const useMessenger = (): MessengerContextType => {
  const context = useContext(MessengerContext);
  if (!context) {
    throw new Error('useMessenger must be used within a MessengerProvider');
  }
  return context;
};

interface MessengerProviderProps {
  children: ReactNode;
}

interface MessengerState {
  open: boolean;
  message: string;
  title: string;
  type: MessageType;
  confirmAction: (() => void) | null;
  cancelAction: (() => void) | null;
  confirmButtonText: string;
  cancelButtonText: string;
  confirmButtonColor: 'default' | 'destructive' | 'secondary';
}

export const MessengerProvider: React.FC<MessengerProviderProps> = ({
  children,
}) => {
  const { actualTheme } = useTheme();
  const [state, setState] = useState<MessengerState>({
    open: false,
    message: '',
    title: '',
    type: 'info',
    confirmAction: null,
    cancelAction: null,
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    confirmButtonColor: 'default',
  });

  const showMessageByType = (
    message: string,
    title: string | undefined,
    type: MessageType,
    confirmAction: (() => void) | null = null,
    cancelAction: (() => void) | null = null,
    confirmButtonText = 'OK',
    cancelButtonText = 'Cancel'
  ) => {
    // Detect if this is a delete confirmation based on button text or title
    const isDeleteConfirmation =
      confirmButtonText.toLowerCase() === 'delete' ||
      confirmButtonText.toLowerCase() === 'sign out' ||
      confirmButtonText.toLowerCase() === 'archive' ||
      confirmButtonText.toLowerCase() === 'remove' ||
      (title && title.toLowerCase().includes('delete') ||
        title && title.toLowerCase().includes('sign out') ||
        title && title.toLowerCase().includes('archive') ||
        title && title.toLowerCase().includes('remove'));

    setState({
      open: true,
      message,
      title: title || getDefaultTitle(type),
      type,
      confirmAction,
      cancelAction,
      confirmButtonText,
      cancelButtonText,
      confirmButtonColor: isDeleteConfirmation ? 'destructive' : 'default',
    });
  };

  const getDefaultTitle = (type: MessageType): string => {
    switch (type) {
      case 'info':
        return 'Information';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'success':
        return 'Success';
      case 'confirm':
        return 'Confirmation';
      default:
        return 'Message';
    }
  };

  const getIconByType = () => {
    switch (state.type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'confirm':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Toast replacements with sonner
  const showMessage = (message: string, title?: string) =>
    toast.info(message, { description: title });
  const showError = (message: string, title?: string) =>
    toast.error(message, { description: title });
  const showWarning = (message: string, title?: string) =>
    toast.warning(message, { description: title });
  const showSuccess = (message: string, title?: string) =>
    toast.success(message, { description: title });

  const showConfirm = (
    message: string,
    title?: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmButtonText = 'Confirm',
    cancelButtonText = 'Cancel'
  ) =>
    showMessageByType(
      message,
      title,
      'confirm',
      onConfirm || (() => { }),
      onCancel || (() => { }),
      confirmButtonText,
      cancelButtonText
    );

  const handleClose = () => {
    if (state.cancelAction) state.cancelAction();
    setState((prev) => ({ ...prev, open: false }));
  };

  const handleConfirm = () => {
    if (state.confirmAction) state.confirmAction();
    setState((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    MessengerService.setHandlers(
      showMessage,
      showError,
      showWarning,
      showSuccess,
      showConfirm
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MessengerContext.Provider
      value={{
        showMessage,
        showError,
        showWarning,
        showSuccess,
        showConfirm,
      }}
    >
      {children}
      <Messenger
        open={state.open}
        title={state.title}
        message={state.message}
        confirmButtonText={state.confirmButtonText}
        cancelButtonText={state.cancelButtonText}
        confirmButtonColor={state.confirmButtonColor}
        onConfirm={handleConfirm}
        onCancel={handleClose}
      // icon={getIconByType()}
      />
      <Toaster
        position="bottom-left"
        closeButton
        theme={actualTheme}
        toastOptions={{
          style: {
            background: 'var(--color-sidebar-accent)',
            color: 'var(--color-foreground)',
          },
        }}
        icons={{
          info: <Info className="h-5 w-5 text-blue-500" />,
          error: <XCircle className="h-5 w-5 text-red-500" />,
          success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
        }}
        swipeDirections={['top', 'bottom', 'left', 'right']}
      />
    </MessengerContext.Provider>
  );
};

export default MessengerContext;
