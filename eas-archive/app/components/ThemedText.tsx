import { Text, TextProps } from 'react-native';

interface Props extends TextProps {
  type?: 'default' | 'defaultSemiBold' | 'title' | 'link' | 'heading';
}

export const ThemedText = ({ style, type = 'default', ...props }: Props) => {
  let fontStyles = {};

  switch (type) {
    case 'title':
      fontStyles = {
        fontSize: 32,
        fontWeight: 'bold',
      };
      break;
    case 'heading':
      fontStyles = {
        fontSize: 24,
        fontWeight: '600',
      };
      break;
    case 'defaultSemiBold':
      fontStyles = {
        fontWeight: '600',
      };
      break;
    case 'link':
      fontStyles = {
        color: '#0891B2',
        textDecorationLine: 'underline',
      };
      break;
  }

  return <Text style={[fontStyles, style]} {...props} />;
};