import { Text, View } from "react-native";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <View className="mb-8">
      <Text className="text-3xl font-bold text-black">{title}</Text>

      {subtitle && <Text className="mt-2 text-gray-500">{subtitle}</Text>}
    </View>
  );
}
