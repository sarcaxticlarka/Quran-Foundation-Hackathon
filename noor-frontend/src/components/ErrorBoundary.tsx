import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

const { width: SW } = Dimensions.get('window');

interface Props {
  children: React.ReactNode;
  onGoHome?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  slideAnim: Animated.Value;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, slideAnim: new Animated.Value(60) };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info.componentStack);
    // Animate the modal in
    Animated.spring(this.state.slideAnim, {
      toValue: 0, useNativeDriver: true, tension: 65, friction: 9,
    }).start();
  }

  reset = () => {
    Animated.timing(this.state.slideAnim, {
      toValue: 60, duration: 200, useNativeDriver: true,
    }).start(() => this.setState({ hasError: false, error: undefined }));
  };

  goHome = () => {
    this.reset();
    this.props.onGoHome?.();
  };

  render() {
    return (
      <>
        {this.props.children}
        <Modal
          visible={this.state.hasError}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={this.reset}
        >
          <View style={styles.overlay}>
            <Animated.View style={[styles.sheet, { transform: [{ translateY: this.state.slideAnim }] }]}>
              {/* Icon */}
              <View style={styles.iconRing}>
                <Ionicons name="construct-outline" size={28} color={Colors.gold} />
              </View>

              {/* Copy */}
              <Text style={styles.title}>We hit a snag</Text>
              <Text style={styles.body}>
                We've noted this error and our team is already working on it.
                Sorry for the interruption!
              </Text>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Actions */}
              <TouchableOpacity style={styles.homeBtn} onPress={this.goHome} activeOpacity={0.85}>
                <Ionicons name="home-outline" size={17} color={Colors.darkBg} />
                <Text style={styles.homeBtnText}>Return to Home</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.retryBtn} onPress={this.reset} activeOpacity={0.8}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      </>
    );
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 36,
  },
  sheet: {
    width: SW - 32, backgroundColor: Colors.darkBg2,
    borderRadius: 24, padding: 28, alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: Colors.darkBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5, shadowRadius: 24, elevation: 20,
  },
  iconRing: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(201,164,86,0.1)',
    borderWidth: 1, borderColor: 'rgba(201,164,86,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 22, color: Colors.textPrimary, textAlign: 'center',
  },
  body: {
    fontFamily: 'Raleway_400Regular',
    fontSize: 14, color: Colors.textMuted,
    textAlign: 'center', lineHeight: 22,
  },
  divider: { width: '100%', height: 1, backgroundColor: Colors.darkBorder },
  homeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.gold, borderRadius: 14,
    paddingVertical: 15, width: '100%',
  },
  homeBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 15, color: Colors.darkBg },
  retryBtn: {
    paddingVertical: 6,
  },
  retryBtnText: {
    fontFamily: 'Raleway_600SemiBold', fontSize: 13, color: Colors.textMuted,
  },
});
