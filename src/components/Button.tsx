import { Text, TouchableOpacity } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
}

export default function Button({
  title,
  onPress,
  loading = false,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      className="rounded-xl bg-black py-4"
    >
      <Text className="text-center text-lg font-semibold text-white">
        {loading ? "Loading..." : title}
      </Text>
    </TouchableOpacity>
  );
}
