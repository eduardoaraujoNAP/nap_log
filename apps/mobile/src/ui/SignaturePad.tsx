import { useMemo, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import type { SignaturePoint } from '../evidence/types';
interface Props { value: SignaturePoint[]; onChange(value: SignaturePoint[]): void; }
export function SignaturePad({ value, onChange }: Props) {
  const [size, setSize] = useState({ width: 1, height: 1 }); const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => onChange([...value, { x: event.nativeEvent.locationX / size.width, y: event.nativeEvent.locationY / size.height, stroke: Date.now() }]),
    onPanResponderMove: (event) => onChange([...value, { x: event.nativeEvent.locationX / size.width, y: event.nativeEvent.locationY / size.height, stroke: Date.now() }]),
  }), [onChange, size.height, size.width, value]);
  return <View><View style={styles.pad} onLayout={({ nativeEvent }) => setSize(nativeEvent.layout)} {...responder.panHandlers}>{value.map((point, index) => <View key={`${point.stroke}-${index}`} style={[styles.point, { left: `${point.x * 100}%`, top: `${point.y * 100}%` }]} />)}{!value.length && <Text style={styles.hint}>Assine aqui</Text>}</View><Text style={styles.clear} onPress={() => onChange([])}>Limpar assinatura</Text></View>;
}
const styles = StyleSheet.create({ pad: { height: 170, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, backgroundColor: '#FFF', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, hint: { color: '#94A3B8' }, point: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#17202A' }, clear: { color: '#B42318', textAlign: 'right', paddingVertical: 9, fontWeight: '600' } });
