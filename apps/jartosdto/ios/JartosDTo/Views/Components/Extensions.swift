import SwiftUI

/// Color from hex integer.
extension Color {
    init(hex: UInt, opacity: Double = 1.0) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: opacity
        )
    }
}

/// Helper to use LinearGradient as AnyShapeStyle for background.
extension LinearGradient {
    var asAnyShapeStyle: AnyShapeStyle {
        AnyShapeStyle(self)
    }
}
