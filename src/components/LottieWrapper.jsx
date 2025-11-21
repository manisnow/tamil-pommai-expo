import React, { useEffect, useRef, useState } from "react";
import { Platform, View, StyleSheet } from "react-native";
import PropTypes from "prop-types";

export default function LottieWrapper({ animationData, style, loop = true, autoPlay = true }) {
  const isWeb = Platform.OS === "web";
  const ref = useRef(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isWeb) {
      try {
        const lottie = require("lottie-web");
        if (ref.current && animationData) {
          const anim = lottie.loadAnimation({
            container: ref.current,
            renderer: "svg",
            loop,
            autoplay: autoPlay,
            animationData,
            onError: (error) => {
              console.error("Lottie animation error:", error);
            }
          });
          return () => {
            try {
              anim.destroy();
            } catch (e) {
              console.warn("Error destroying animation:", e);
            }
          };
        }
      } catch (error) {
        console.error("Error loading lottie-web:", error);
        setHasError(true);
      }
    }
  }, [animationData, isWeb, loop, autoPlay]);

  if (isWeb) {
    if (hasError) {
      return (
        <div 
          style={{ 
            width: style?.width || 300, 
            height: style?.height || 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            border: '2px dashed #ccc',
            borderRadius: '10px'
          }}
        >
          <span style={{ fontSize: '48px' }}>🎭</span>
        </div>
      );
    }
    return <div ref={ref} style={{ width: style?.width || 300, height: style?.height || 300 }} />;
  }

  // native
  const LottieView = require("lottie-react-native").default;
  return (
    <View style={[styles.container, style]}>
      <LottieView source={animationData} autoPlay={autoPlay} loop={loop} style={{ flex: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 300, height: 300 }
});

LottieWrapper.propTypes = {
  animationData: PropTypes.object.isRequired,
  style: PropTypes.object,
  loop: PropTypes.bool,
  autoPlay: PropTypes.bool
};