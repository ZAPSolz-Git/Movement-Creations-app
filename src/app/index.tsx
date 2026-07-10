import { View } from "react-native";

import Button from "../components/Button";
import Input from "../components/Input";
import Logo from "../components/Logo";

import { router } from "expo-router";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <Logo />

      <Input placeholder="Email" value={email} onChangeText={setEmail} />

      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        password
      />

      <Button
        title="Login"
        onPress={() => {
          router.push("/home");
        }}
      />
    </View>
  );
}
