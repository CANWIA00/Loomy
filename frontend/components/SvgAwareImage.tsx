import { Image, StyleSheet, type ImageStyle, type StyleProp } from "react-native";
import { SvgXml } from "react-native-svg";

type Props = {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "center" | "repeat";
};

export default function SvgAwareImage({ uri, style, resizeMode = "contain" }: Props) {
  if (uri && uri.startsWith("data:image/svg")) {
    const xml = decodeURIComponent(uri.slice(uri.indexOf(",") + 1));
    const styleObj = StyleSheet.flatten(style) as ImageStyle;
    const width = (styleObj.width as number | string) ?? 100;
    const height = (styleObj.height as number | string) ?? 100;
    return <SvgXml xml={xml} width={width} height={height} style={style} />;
  }

  return <Image source={{ uri: uri || undefined }} style={style} resizeMode={resizeMode} />;
}
