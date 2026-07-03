import SwiftUI

/// Login / Register view with premium dark design.
struct LoginView: View {
    @Environment(APIService.self) private var api
    @State private var isLogin = true
    @State private var email = ""
    @State private var password = ""
    @State private var name = ""
    #if targetEnvironment(simulator)
    @State private var serverURL = "http://localhost:8100/api/v1"
    #else
    @State private var serverURL = "http://msbross.me:8100/api/v1"
    #endif
    @State private var error: String?
    @State private var loading = false
    @State private var showSettings = false

    var body: some View {
        ZStack {
            // Background
            Color(hex: 0x0A0A0F).ignoresSafeArea()

            // Ambient glow
            Circle()
                .fill(RadialGradient(colors: [Color(hex: 0x818CF8).opacity(0.12), .clear], center: .center, startRadius: 0, endRadius: 300))
                .frame(width: 600, height: 600)
                .offset(y: -150)

            ScrollView {
                VStack(spacing: 24) {
                    Spacer().frame(height: 60)

                    // Logo
                    VStack(spacing: 12) {
                        RoundedRectangle(cornerRadius: 16)
                            .fill(LinearGradient(colors: [Color(hex: 0x818CF8), Color(hex: 0xC084FC)], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 56, height: 56)
                            .overlay(Text("⚡").font(.title))

                        Text("JartosDTo")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundStyle(LinearGradient(colors: [Color(hex: 0x818CF8), Color(hex: 0xA78BFA), Color(hex: 0xC084FC)], startPoint: .leading, endPoint: .trailing))

                        Text("Unified AI Chat Platform")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    // Tabs
                    HStack(spacing: 4) {
                        TabButton(title: "Login", isSelected: isLogin) { isLogin = true }
                        TabButton(title: "Register", isSelected: !isLogin) { isLogin = false }
                    }
                    .padding(4)
                    .background(Color(hex: 0x0A0A0F))
                    .clipShape(RoundedRectangle(cornerRadius: 10))

                    // Form
                    VStack(spacing: 16) {
                        if !isLogin {
                            InputField(label: "Name", text: $name, placeholder: "Your name")
                        }
                        InputField(label: "Email", text: $email, placeholder: "you@example.com")
                            #if os(iOS)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                            #endif

                        InputField(label: "Password", text: $password, placeholder: "••••••••", isSecure: true)

                        if let error {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(.red)
                        }

                        Button(action: submit) {
                            HStack {
                                if loading {
                                    ProgressView().tint(.white)
                                } else {
                                    Text(isLogin ? "Sign In" : "Create Account")
                                        .fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                            .background(LinearGradient(colors: [Color(hex: 0x818CF8), Color(hex: 0xC084FC)], startPoint: .leading, endPoint: .trailing))
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                        .disabled(loading)
                    }

                    // Server URL
                    Button { showSettings.toggle() } label: {
                        HStack {
                            Image(systemName: "server.rack")
                            Text("Server Settings")
                        }
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    }

                    if showSettings {
                        InputField(label: "API URL", text: $serverURL, placeholder: "http://localhost:8100/api/v1")
                            .onChange(of: serverURL) { _, val in api.baseURL = val }
                    }

                    Spacer()
                }
                .padding(.horizontal, 32)
            }
        }
    }

    private func submit() {
        error = nil
        loading = true
        Task {
            do {
                if isLogin {
                    try await api.login(email: email, password: password)
                } else {
                    try await api.register(email: email, password: password, name: name.isEmpty ? nil : name)
                }
            } catch {
                self.error = isLogin ? "Invalid credentials" : "Registration failed"
            }
            loading = false
        }
    }
}

// MARK: - Subcomponents

struct TabButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline).fontWeight(.medium)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(isSelected ? Color(hex: 0x22223A) : .clear)
                .foregroundStyle(isSelected ? .white : .secondary)
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }
}

struct InputField: View {
    let label: String
    @Binding var text: String
    var placeholder: String = ""
    var isSecure: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.caption).foregroundStyle(.secondary)
            Group {
                if isSecure {
                    SecureField(placeholder, text: $text)
                } else {
                    TextField(placeholder, text: $text)
                }
            }
            .padding(12)
            .background(Color(hex: 0x12121A))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.white.opacity(0.06)))
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }
}
