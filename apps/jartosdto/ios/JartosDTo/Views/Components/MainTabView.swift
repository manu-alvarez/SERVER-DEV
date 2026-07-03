import SwiftUI

/// Main tab navigation: Chat, History, Admin.
struct MainTabView: View {
    @Environment(APIService.self) private var api

    var body: some View {
        TabView {
            Tab("Chat", systemImage: "bubble.left.and.bubble.right.fill") {
                ChatView()
            }
            Tab("History", systemImage: "clock.fill") {
                HistoryView()
            }
            if api.currentUser?.role == "admin" {
                Tab("Admin", systemImage: "gearshape.fill") {
                    AdminDashboardView()
                }
            }
            Tab("Settings", systemImage: "person.circle.fill") {
                SettingsView()
            }
        }
        .tint(Color(hex: 0x818CF8))
    }
}

/// Conversation history list.
struct HistoryView: View {
    @Environment(APIService.self) private var api
    @State private var conversations: [Conversation] = []

    var body: some View {
        NavigationStack {
            List {
                if conversations.isEmpty {
                    ContentUnavailableView("No Conversations", systemImage: "bubble.left", description: Text("Start chatting to see history"))
                }
                ForEach(conversations) { conv in
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(conv.title).font(.subheadline).fontWeight(.medium)
                            Text("\(conv.message_count) messages").font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(conv.created_at.prefix(10)).font(.caption2).foregroundStyle(.tertiary)
                    }
                    .listRowBackground(Color(hex: 0x12121A))
                }
                .onDelete { idx in
                    for i in idx {
                        let id = conversations[i].id
                        Task { try? await api.deleteConversation(id) }
                    }
                    conversations.remove(atOffsets: idx)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color(hex: 0x0A0A0F))
            .navigationTitle("History")
            .task { conversations = (try? await api.getConversations()) ?? [] }
            .refreshable { conversations = (try? await api.getConversations()) ?? [] }
        }
    }
}

/// User settings / logout.
struct SettingsView: View {
    @Environment(APIService.self) private var api

    var body: some View {
        NavigationStack {
            List {
                Section("Account") {
                    LabeledContent("Email", value: api.currentUser?.email ?? "—")
                    LabeledContent("Role", value: api.currentUser?.role ?? "—")
                    LabeledContent("Name", value: api.currentUser?.display_name ?? "—")
                }
                .listRowBackground(Color(hex: 0x12121A))

                Section("Server") {
                    LabeledContent("API", value: api.baseURL)
                }
                .listRowBackground(Color(hex: 0x12121A))

                Section {
                    Button("Logout", role: .destructive) { api.logout() }
                }
                .listRowBackground(Color(hex: 0x12121A))
            }
            .scrollContentBackground(.hidden)
            .background(Color(hex: 0x0A0A0F))
            .navigationTitle("Settings")
        }
    }
}
