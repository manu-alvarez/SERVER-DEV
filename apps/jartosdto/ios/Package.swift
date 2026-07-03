// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "JartosDTo",
    platforms: [.iOS(.v17), .macOS(.v15)],
    products: [
        .executable(name: "JartosDTo", targets: ["JartosDTo"])
    ],
    targets: [
        .executableTarget(
            name: "JartosDTo",
            path: "JartosDTo",
            swiftSettings: [.swiftLanguageMode(.v5)]
        )
    ]
)
