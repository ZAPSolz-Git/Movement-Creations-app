import { Text, TouchableOpacity } from "react-native";

interface Props {
  title: string;
  onPress: () => void;
}

export default function Button({ title, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} className="rounded-xl bg-black py-4">
      <Text className="text-center text-lg font-bold text-white">{title}</Text>
    </TouchableOpacity>
  );
}
