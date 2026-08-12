import { useState, useEffect, useRef, useCallback } from 'react'
import { View, ScrollView, Image, Text, Dimensions, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { colors } from '../../theme/colors'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = SCREEN_WIDTH - 32
const CARD_GAP = 12

type Slide = {
  id: string
  imageUrl?: string
  title: string
  subtitle?: string
  bgColor?: string
}

type CarouselProps = {
  slides: Slide[]
  autoplayInterval?: number
}

export default function Carousel({ slides, autoplayInterval = 4000 }: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH)
    setActiveIndex(index)
  }, [])

  // Autoplay: avanza cada `autoplayInterval` si hay más de un slide.
  useEffect(() => {
    if (slides.length <= 1) return
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % slides.length
        scrollRef.current?.scrollTo({ x: next * CARD_WIDTH, animated: true })
        return next
      })
    }, autoplayInterval)
    return () => clearInterval(interval)
  }, [slides.length, autoplayInterval])

  if (slides.length === 0) return null

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {slides.map((slide, i) => (
          <View
            key={slide.id}
            style={[
              styles.slide,
              { backgroundColor: slide.bgColor || colors.primary, marginRight: i < slides.length - 1 ? CARD_GAP : 0 },
            ]}
          >
            {slide.imageUrl ? (
              <Image source={{ uri: slide.imageUrl }} style={styles.slideImage} resizeMode="cover" />
            ) : null}
            <View style={styles.slideOverlay}>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              {slide.subtitle ? <Text style={styles.slideSubtitle}>{slide.subtitle}</Text> : null}
            </View>
          </View>
        ))}
      </ScrollView>
      {slides.length > 1 && (
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  slide: {
    width: CARD_WIDTH,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
  },
  slideImage: { ...StyleSheet.absoluteFillObject, width: CARD_WIDTH, height: 160 },
  slideOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  slideTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', fontFamily: 'Poppins_700Bold', marginBottom: 2 },
  slideSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gray[300], marginHorizontal: 3 },
  dotActive: { width: 20, backgroundColor: colors.primary },
})
