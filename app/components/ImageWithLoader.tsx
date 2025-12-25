import React, { useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, ImageProps, ImageSourcePropType } from 'react-native';
import { validateStorageUrl, fixStorageUrlEncoding } from '../../lib/storage';

interface ImageWithLoaderProps extends Omit<ImageProps, 'source'> {
  source: ImageSourcePropType;
  loaderSize?: 'small' | 'medium' | 'large';
  debugLabel?: string; // Optional label for debugging
}

export const ImageWithLoader: React.FC<ImageWithLoaderProps> = ({
  source,
  style,
  loaderSize = 'medium',
  debugLabel = 'Image',
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const getLoaderSize = () => {
    switch (loaderSize) {
      case 'small': return 20;
      case 'large': return 40;
      default: return 30;
    }
  };

  const getImageUrl = () => {
    if (typeof source === 'object' && 'uri' in source) {
      return source.uri;
    }
    return 'Local image';
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
    const imageUrl = getImageUrl();
    console.log(`🔄 [${debugLabel}] Image loading started:`, imageUrl);

    // Validate Firebase Storage URLs
    if (typeof source === 'object' && 'uri' in source && source.uri) {
      const isValid = validateStorageUrl(source.uri);
      if (!isValid) {
        console.warn(`⚠️ [${debugLabel}] Potentially invalid Firebase Storage URL:`, source.uri);
      }
    }
  };

  // Get the corrected source with fixed URL encoding
  const getCorrectedSource = () => {
    if (typeof source === 'object' && 'uri' in source && source.uri) {
      const fixedUri = fixStorageUrlEncoding(source.uri);
      return { ...source, uri: fixedUri };
    }
    return source;
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    console.log(`✅ [${debugLabel}] Image loaded successfully:`, getImageUrl());
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    setHasError(true);
    console.warn(`❌ [${debugLabel}] Image failed to load:`, getImageUrl(), error?.nativeEvent);
  };

  return (
    <View style={[styles.container, style]}>
      {!hasError ? (
        <Image
          source={getCorrectedSource()}
          style={[StyleSheet.absoluteFillObject, { opacity: isLoading ? 0 : 1 }]}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          {...props}
        />
      ) : (
        <Image
          source={require('../../assets/images/products/product-1.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      )}

      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size={getLoaderSize()}
            color="#22C55E"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  errorContainer: {
    backgroundColor: '#f0f0f0',
  },
});
