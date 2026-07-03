import SwiftUI

/// Admin dashboard with stats and quick actions.
struct AdminDashboardView: View {
    @Environment(APIService.self) private var api
    @State private var stats: AdminStats?
    @State private var selectedTab = 0

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Stats cards
                    LazyVGrid(columns: [.init(.flexible()), .init(.flexible())], spacing: 12) {
                        StatCard(icon: "👥", label: "Users", value: stats?.total_users, color: Color(hex: 0x818CF8))
                        StatCard(icon: "💬", label: "Conversations", value: stats?.total_conversations, color: Color(hex: 0xA78BFA))
                        StatCard(icon: "📨", label: "Messages", value: stats?.total_messages, color: Color(hex: 0xC084FC))
                        StatCard(icon: "📄", label: "Documents", value: stats?.total_documents, color: Color(hex: 0xF472B6))
                    }
                    .padding(.horizontal)

                    // Quick actions
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Quick Actions")
                            .font(.headline).fontWeight(.semibold)
                            .padding(.horizontal)

                        VStack(spacing: 8) {
                            ActionRow(icon: "🤖", title: "Models", desc: "Manage LLM providers")
                            ActionRow(icon: "🧩", title: "Agents", desc: "Create custom AI agents")
                            ActionRow(icon: "📝", title: "Prompts", desc: "Edit system prompts")
                            ActionRow(icon: "⚙️", title: "Settings", desc: "Global configuration")
                        }
                        .padding(.horizontal)
                    }

                    // System info
                    VStack(alignment: .leading, spacing: 12) {
                        Text("System Info")
                            .font(.headline).fontWeight(.semibold)
                            .padding(.horizontal)

                        VStack(spacing: 1) {
                            InfoRow(label: "API URL", value: api.baseURL)
                            InfoRow(label: "User", value: api.currentUser?.email ?? "—")
                            InfoRow(label: "Role", value: api.currentUser?.role ?? "—")
                        }
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .background(Color(hex: 0x0A0A0F))
            .navigationTitle("Admin")
            .task { stats = try? await api.getAdminStats() }
            .refreshable { stats = try? await api.getAdminStats() }
        }
    }
}

// MARK: - Stat Card

struct StatCard: View {
    let icon: String
    let label: String
    let value: Int?
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(icon).font(.title2)
                Spacer()
                Circle().fill(color).frame(width: 8, height: 8)
            }
            Text(value.map { "\($0)" } ?? "—")
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(color)
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(16)
        .background(Color(hex: 0x12121A).opacity(0.8))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.06)))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Action Row

struct ActionRow: View {
    let icon: String
    let title: String
    let desc: String

    var body: some View {
        HStack(spacing: 14) {
            Text(icon).font(.title2)
                .frame(width: 44, height: 44)
                .background(Color(hex: 0x1A1A28))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline).fontWeight(.semibold)
                Text(desc).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "chevron.right").font(.caption).foregroundStyle(.tertiary)
        }
        .padding(14)
        .background(Color(hex: 0x12121A).opacity(0.8))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.06)))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Info Row

struct InfoRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label).foregroundStyle(.secondary)
            Spacer()
            Text(value).font(.caption).foregroundStyle(.tertiary).lineLimit(1)
        }
        .padding(14)
        .background(Color(hex: 0x12121A))
    }
}
