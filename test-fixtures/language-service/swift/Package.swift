// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "CommentDocLensSwiftFixture",
    platforms: [.macOS(.v13)],
    products: [
        .library(name: "CommentDocLensSwiftFixture", targets: ["CommentDocLensSwift"])
    ],
    targets: [
        .target(name: "CommentDocLensSwift")
    ]
)

