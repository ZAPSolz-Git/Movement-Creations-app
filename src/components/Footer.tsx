import { Text, TouchableOpacity, View } from "react-native";

import { Feather, Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";

const menuItems = [
  {
    name: "Dashboard",
    icon: "grid",
    library: "feather",
    route: "/home",
  },
  {
    name: "Release",
    icon: "copy",
    library: "feather",
    route: "/Release",
  },
  {
    name: "Revenue",
    icon: "card-outline",
    library: "ion",
    route: "/revenue",
  },
  {
    name: "Reports",
    icon: "bar-chart-2",
    library: "feather",
    route: "/reports",
  },
  {
    name: "Rights",
    icon: "shield",
    library: "feather",
    route: "/rights",
  },
  {
    name: "Profile",
    icon: "user",
    library: "feather",
    route: "/profile",
  },
];

export default function Footer() {
  const pathname = usePathname();

  return (
    <View
      className="
        absolute
        bottom-0
        left-0
        right-0

        bg-[#FAF8FF]

        rounded-t-[25px]

        pt-2
        pb-4

        shadow-lg
      "
    >
      {/* Header */}
      <Text
        className="
          ml-6

          text-[13px]
          font-bold

          tracking-widest

          text-[#34405A]
        "
      >
        QUICK ACTIONS
      </Text>

      {/* Navigation */}
      <View
        className="
          flex-row
          justify-around

          mt-5
        "
      >
        {menuItems.map((item, index) => {
          const isActive = pathname === item.route;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => item.route && router.push(item.route as any)}
              className="
                items-center
                justify-center

                w-[65px]
              "
            >
              {isActive && (
                <View
                  className="
                    absolute
                    -top-3

                    h-[3px]
                    w-[50px]

                    rounded-full

                    bg-[#8B3DFF]
                  "
                />
              )}

              {item.library === "feather" ? (
                <Feather
                  name={item.icon as any}
                  size={22}
                  color={isActive ? "#8B3DFF" : "#555555"}
                />
              ) : (
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={isActive ? "#8B3DFF" : "#555555"}
                />
              )}

              <Text
                className={`
                  mt-2

                  text-xs
                  font-semibold

                  ${isActive ? "text-[#8B3DFF]" : "text-[#555555]"}
                `}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
