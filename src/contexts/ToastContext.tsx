import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle,
  XCircle,
  Warning,
  Info,
  X,
} from 'phosphor-react-native';

// ---------- Types ----------

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 3000
}

interface ToastContextValue {
  showToast: (config: ToastConfig) => void;
}

// ---------- Context ----------

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

// ---------- Appearance map ----------

const TOAST_STYLES: Record<
  ToastType,
  { bg: string; border: string; iconColor: string; icon: typeof CheckCircle }
> = {
  success: {
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.35)',
    iconColor: '#10B981',
    icon: CheckCircle,
  },
  error: {
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.35)',
    iconColor: '#EF4444',
    icon: XCircle,
  },
  warning: {
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
    iconColor: '#F59E0B',
    icon: Warning,
  },
  info: {
    bg: 'rgba(56,189,248,0.12)',
    border: 'rgba(56,189,248,0.35)',
    iconColor: '#38BDF8',
    icon: Info,
  },
};

// ---------- Provider ----------

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  }, [translateY, opacity]);

  const showToast = useCallback(
    (config: ToastConfig) => {
      // Clear previous timer
      if (timerRef.current) clearTimeout(timerRef.current);

      setToast(config);

      // Reset and animate in
      translateY.setValue(-120);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 18,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss
      timerRef.current = setTimeout(dismiss, config.duration ?? 3000);
    },
    [translateY, opacity, dismiss],
  );

  const style = toast ? TOAST_STYLES[toast.type] : TOAST_STYLES.info;
  const IconComponent = style.icon;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.container,
            {
              top: insets.top + (Platform.OS === 'ios' ? 4 : 12),
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          <View
            style={[
              styles.toast,
              { backgroundColor: style.bg, borderColor: style.border },
            ]}
          >
            {/* Icon */}
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: style.iconColor + '18' },
              ]}
            >
              <IconComponent
                size={20}
                weight="fill"
                color={style.iconColor}
              />
            </View>

            {/* Text */}
            <View style={styles.textWrap}>
              <Text style={styles.title}>{toast.title}</Text>
              {toast.message ? (
                <Text style={styles.message} numberOfLines={2}>
                  {toast.message}
                </Text>
              ) : null}
            </View>

            {/* Close */}
            <Pressable
              onPress={dismiss}
              hitSlop={8}
              style={styles.closeBtn}
            >
              <X size={14} color="rgba(148,163,184,0.7)" />
            </Pressable>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
    // Glassmorphic backdrop
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    // Fallback opaque dark bg for Android (no blur)
    ...Platform.select({
      android: { backgroundColor: 'rgba(15,23,42,0.97)' },
    }),
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: '#F8FAFC',
  },
  message: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
