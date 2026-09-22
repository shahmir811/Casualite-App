import { DrawerActions, useNavigation } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { SizeChartContent } from '@/components/size-chart-content';
import { Colors } from '@/constants/theme';

export default function SizeChartScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Size Chart" onLeftPress={() => navigation.dispatch(DrawerActions.openDrawer())} />
      <SizeChartContent />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
