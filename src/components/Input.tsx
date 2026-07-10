import { TextInput } from "react-native";

interface InputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  password?: boolean;
}

export default function Input({
  placeholder,
  value,
  onChangeText,
  password = false,
}: InputProps) {
  return (
    <TextInput
      className="mb-4 rounded-xl border border-gray-300 px-4 py-4 text-base"
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={password}
    />
  );
}
