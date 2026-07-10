import { Text, TouchableOpacity, View } from "react-native";

import { Feather, Ionicons } from "@expo/vector-icons";

const menuItems = [
  {
    name: "Dashboard",
    icon: "grid",
    active: true,
    library: "feather",
  },
  {
    name: "Tracks",
    icon: "copy",
    library: "feather",
  },
  {
    name: "Revenue",
    icon: "card-outline",
    library: "ion",
  },
  {
    name: "Reports",
    icon: "bar-chart-2",
    library: "feather",
  },
  {
    name: "Profile",
    icon: "user",
    library: "feather",
  },
];

export default function Footer() {
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
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            className="
                items-center
                justify-center

                w-[65px]
              "
          >
            {item.active && (
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
                color={item.active ? "#8B3DFF" : "#555555"}
              />
            ) : (
              <Ionicons
                name={item.icon as any}
                size={22}
                color={item.active ? "#8B3DFF" : "#555555"}
              />
            )}

            <Text
              className={`
                  mt-2

                  text-xs
                  font-semibold

                  ${item.active ? "text-[#8B3DFF]" : "text-[#555555]"}
                `}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
