import { View, ViewProps } from "react-native";

export default function Card({ children }: ViewProps) {
  return <View className="rounded-2xl bg-white p-5 shadow">{children}</View>;
}
