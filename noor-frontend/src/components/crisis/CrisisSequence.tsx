import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

interface Step {
  step: number;
  label: string;
  isActive: boolean;
  isComplete: boolean;
}

const STEPS: Array<{ label: string }> = [
  { label: 'Mood' },
  { label: 'Context' },
  { label: 'Verses' },
  { label: 'Dhikr' },
  { label: 'Reflect' },
];

interface CrisisSequenceProps {
  currentStep: number; // 1-5
}

export function CrisisSequence({ currentStep }: CrisisSequenceProps) {
  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isComplete = stepNum < currentStep;

        return (
          <React.Fragment key={step.label}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isComplete && styles.stepCircleComplete,
                  isActive && styles.stepCircleActive,
                ]}
              >
                {isComplete ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text style={[styles.stepNum, isActive && styles.stepNumActive]}>
                    {stepNum}
                  </Text>
                )}
              </View>
              <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                {step.label}
              </Text>
            </View>

            {index < STEPS.length - 1 && (
              <View style={[styles.connector, isComplete && styles.connectorComplete]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 0,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.darkBg2,
    borderWidth: 1.5,
    borderColor: Colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: Colors.gold,
    backgroundColor: Colors.goldMuted,
  },
  stepCircleComplete: {
    backgroundColor: Colors.gold,
    borderColor: Colors.teal,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  stepNumActive: {
    color: Colors.gold,
  },
  checkmark: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  stepLabelActive: {
    color: Colors.gold,
    fontWeight: '600',
  },
  connector: {
    flex: 1,
    height: 1.5,
    backgroundColor: Colors.darkBorder,
    marginBottom: 18,
    minWidth: 16,
    maxWidth: 32,
  },
  connectorComplete: {
    backgroundColor: Colors.gold,
  },
});
