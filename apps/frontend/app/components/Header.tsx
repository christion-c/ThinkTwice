import { Pressable, Text, View} from "react-native"

export default function NavBar({
    onMenuPress,
}: {
    onMenuPress?: () => void;
}) {
    return (
        <View style={{ height: 70, flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
            {onMenuPress ? (
                <Pressable onPress={onMenuPress}>
                    <Text style={{ color: "#222", fontSize: 28, paddingRight: 20 }}>☰</Text>
                </Pressable>
            ) : (
                <View style={{ width: 36 }} />
            )}

            <Text style={{ color: "#fff", fontSize: 28 }}>Think Twice</Text>
        </View>
    );
}