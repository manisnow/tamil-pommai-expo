import React, { useEffect, useRef } from "react";
import { Platform, View, StyleSheet } from "react-native";
import PropTypes from "prop-types";

export default function LottieWrapper({ animationData, style, loop = true, autoPlay = true }) {
  const isWeb = Platform.OS === "web";
  const ref = useRef(null);

  useEffect(() => {
    if (isWeb) {
      const lottie = require("lottie-web");
      if (ref.current && animationData) {
        const anim = lottie.loadAnimation({
          container: ref.current,
          renderer: "svg",
          loop,
          autoplay: autoPlay,
          animationData
        });
        return () => anim.destroy();
      }
    }
  }, [animationData, isWeb, loop, autoPlay]);

  if (isWeb) {
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