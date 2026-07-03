import SwiftUI

/// App entry point.
@main
struct JartosDToApp: App {
    @State private var api = APIService.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(api)
                .preferredColorScheme(.dark)
        }
    }
}

/// Root view — shows login or main chat based on auth state.
struct RootView: View {
    @Environment(APIService.self) private var api

    var body: some View {
        Group {
            if api.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: api.isAuthenticated)
        .task {
            if api.isAuthenticated {
                try? await api.getMe()
            }
        }
    }
}
