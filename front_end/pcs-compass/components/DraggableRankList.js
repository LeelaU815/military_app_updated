import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';

import { COLORS } from '../theme';

const ITEM_HEIGHT = 60;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// A simple drag-to-reorder list built with React Native's built-in
// PanResponder + Animated (no third-party drag library required).
export default function DraggableRankList({ items, onReorder }) {
  const [order, setOrder] = useState(items.map((item) => item.id));
  const positions = useRef({}).current;
  const draggingId = useRef(null);
  const dragStartIndex = useRef(0);
  const orderRef = useRef(order);
  orderRef.current = order;

  order.forEach((id) => {
    if (!positions[id]) positions[id] = new Animated.Value(0);
  });

  const getIndex = (id) => orderRef.current.indexOf(id);

  const panRespondersRef = useRef({});
  items.forEach((item) => {
    if (!panRespondersRef.current[item.id]) {
      panRespondersRef.current[item.id] = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          draggingId.current = item.id;
          dragStartIndex.current = getIndex(item.id);
        },
        onPanResponderMove: (evt, gestureState) => {
          positions[item.id].setValue(gestureState.dy);
          const newIndex = clamp(
            dragStartIndex.current + Math.round(gestureState.dy / ITEM_HEIGHT),
            0,
            orderRef.current.length - 1
          );
          const currentIndex = getIndex(item.id);
          if (newIndex !== currentIndex) {
            const newOrder = [...orderRef.current];
            newOrder.splice(currentIndex, 1);
            newOrder.splice(newIndex, 0, item.id);
            setOrder(newOrder);
          }
        },
        onPanResponderRelease: () => {
          Animated.spring(positions[item.id], {
            toValue: 0,
            useNativeDriver: false,
          }).start();
          draggingId.current = null;
          if (onReorder) onReorder(orderRef.current);
        },
      });
    }
  });

  return (
    <View style={{ height: ITEM_HEIGHT * order.length }}>
      {order.map((id, index) => {
        const item = items.find((i) => i.id === id);
        const isDragging = draggingId.current === id;
        const top = isDragging ? dragStartIndex.current * ITEM_HEIGHT : index * ITEM_HEIGHT;
        return (
          <Animated.View
            key={id}
            {...panRespondersRef.current[id].panHandlers}
            style={[
              styles.item,
              {
                top,
                transform: [{ translateY: positions[id] }],
                zIndex: isDragging ? 10 : 1,
              },
            ]}
          >
            <Text style={styles.rank}>{index + 1}</Text>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.grip}>≡</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT - 10,
    backgroundColor: COLORS.navyLight,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  rank: {
    color: COLORS.accent,
    fontWeight: 'bold',
    fontSize: 18,
    width: 28,
  },
  label: {
    color: COLORS.white,
    fontSize: 15,
    flex: 1,
  },
  grip: {
    color: COLORS.textOnDark,
    fontSize: 20,
  },
});