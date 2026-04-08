import React from 'react';
import { Animated, Easing } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useAppTheme } from '../context/FinanceContext';

type Props = {
  income: number;
  expenses: number;
  animateKey?: number;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function SummaryRing({ income, expenses, animateKey = 0 }: Props) {
  const theme = useAppTheme();
  const ratio = income <= 0 ? (expenses > 0 ? 1 : 0) : Math.min(expenses / income, 1);
  const ringProgress = React.useRef(new Animated.Value(0)).current;

  const size = 120;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = ringProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, circumference * (1 - ratio)],
  });

  React.useEffect(() => {
    ringProgress.setValue(0);

    const animation = Animated.timing(ringProgress, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start();

    return () => {
      ringProgress.stopAnimation();
    };
  }, [ringProgress, ratio, animateKey]);

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.success}
          strokeWidth={stroke}
          fill="transparent"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.danger}
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset as unknown as number}
          strokeLinecap="round"
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
          fill="transparent"
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.caption, { color: theme.colors.textMuted }]}>Spent</Text>
        <Text style={[styles.percent, { color: theme.colors.text }]}>{Math.floor(ratio * 100)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    fontSize: 12,
  },
  percent: {
    fontSize: 22,
    fontWeight: '700',
  },
});
