import SwiftUI

/// Main chat interface with streaming, model selector, and web search toggle.
struct ChatView: View {
    @Environment(APIService.self) private var api
    @State private var messages: [ChatMessage] = []
    @State private var input = ""
    @State private var isStreaming = false
    @State private var selectedModel = "gpt-4o"
    @State private var webSearch = false
    @State private var models: [ModelInfo] = []
    @State private var showModelPicker = false
    @State private var conversationId: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Messages
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            if messages.isEmpty {
                                emptyState
                            }
                            ForEach(messages) { msg in
                                MessageRow(message: msg, isStreaming: isStreaming && msg.id == messages.last?.id && msg.role == .assistant)
                                    .id(msg.id)
                            }
                        }
                        .padding()
                    }
                    .onChange(of: messages.last?.content) { _, _ in
                        withAnimation { proxy.scrollTo(messages.last?.id, anchor: .bottom) }
                    }
                }

                Divider().overlay(Color.white.opacity(0.06))

                // Input bar
                inputBar
            }
            .background(Color(hex: 0x0A0A0F))
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Button { showModelPicker = true } label: {
                        HStack(spacing: 6) {
                            Circle().fill(providerColor).frame(width: 8, height: 8)
                            Text(currentModelName).font(.subheadline).fontWeight(.medium)
                            Image(systemName: "chevron.down").font(.caption2)
                        }
                        .foregroundStyle(.white)
                    }
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button { newChat() } label: {
                        Image(systemName: "square.and.pencil")
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button { webSearch.toggle() } label: {
                        Image(systemName: webSearch ? "globe" : "globe")
                            .foregroundStyle(webSearch ? Color(hex: 0x818CF8) : .secondary)
                            .symbolVariant(webSearch ? .fill : .none)
                    }
                }
            }
            .sheet(isPresented: $showModelPicker) {
                ModelPickerSheet(models: models, selected: $selectedModel)
                    .presentationDetents([.medium])
            }
            .task { models = (try? await api.getModels()) ?? [] }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer().frame(height: 80)
            RoundedRectangle(cornerRadius: 20)
                .fill(LinearGradient(colors: [Color(hex: 0x818CF8), Color(hex: 0xC084FC)], startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(width: 72, height: 72)
                .overlay(Text("⚡").font(.largeTitle))
                .shadow(color: Color(hex: 0x818CF8).opacity(0.3), radius: 20)

            Text("JartosDTo")
                .font(.title).fontWeight(.bold)
                .foregroundStyle(LinearGradient(colors: [Color(hex: 0x818CF8), Color(hex: 0xC084FC)], startPoint: .leading, endPoint: .trailing))

            Text("Choose a model and start chatting")
                .foregroundStyle(.secondary).font(.subheadline)

            HStack(spacing: 8) {
                FeatureChip(icon: "magnifyingglass", label: "Search")
                FeatureChip(icon: "doc", label: "Files")
                FeatureChip(icon: "brain", label: "Thinking")
                FeatureChip(icon: "terminal", label: "Code")
            }
        }
    }

    // MARK: - Input Bar

    private var inputBar: some View {
        HStack(alignment: .bottom, spacing: 10) {
            TextField("Message \(selectedModel)...", text: $input, axis: .vertical)
                .lineLimit(1...6)
                .padding(12)
                .background(Color(hex: 0x12121A))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.06)))

            Button(action: send) {
                let isEmpty = input.trimmingCharacters(in: .whitespaces).isEmpty
                Image(systemName: "arrow.up")
                    .fontWeight(.semibold)
                    .frame(width: 40, height: 40)
                    .background(
                        isEmpty
                            ? AnyShapeStyle(Color(hex: 0x1A1A28))
                            : AnyShapeStyle(LinearGradient(colors: [Color(hex: 0x818CF8), Color(hex: 0xC084FC)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    )
                    .foregroundStyle(isEmpty ? Color.secondary : Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .disabled(input.trimmingCharacters(in: .whitespaces).isEmpty || isStreaming)
        }
        .padding(.horizontal)
        .padding(.vertical, 10)
        .background(Color(hex: 0x12121A).opacity(0.8))
    }

    // MARK: - Helpers

    private var currentModelName: String {
        models.first { $0.id == selectedModel }?.display_name ?? selectedModel
    }

    private var providerColor: Color {
        let provider = models.first { $0.id == selectedModel }?.provider ?? ""
        return switch provider {
        case "openai": Color(hex: 0x10A37F)
        case "anthropic": Color(hex: 0xCC934F)
        case "google": Color(hex: 0x4285F4)
        case "mistral": Color(hex: 0xFF7700)
        default: .gray
        }
    }

    private func newChat() {
        messages = []
        conversationId = nil
        input = ""
    }

    private func send() {
        let text = input.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }
        input = ""

        let userMsg = ChatMessage(id: UUID().uuidString, role: .user, content: text)
        messages.append(userMsg)

        let assistantMsg = ChatMessage(id: UUID().uuidString, role: .assistant, content: "", modelId: selectedModel)
        messages.append(assistantMsg)

        isStreaming = true
        Task {
            var fullText = ""
            var fullThinking = ""
            let apiMsgs = messages.dropLast().map { APIMessage(role: $0.role.rawValue, content: $0.content) }

            do {
                for try await chunk in api.streamChat(model: selectedModel, messages: apiMsgs, conversationId: conversationId, webSearch: webSearch) {
                    switch chunk.type {
                    case "text":
                        fullText += chunk.content ?? ""
                        if let idx = messages.indices.last {
                            messages[idx].content = fullText
                        }
                    case "thinking":
                        fullThinking += chunk.content ?? ""
                        if let idx = messages.indices.last {
                            messages[idx].thinking = fullThinking
                        }
                    case "sources":
                        if let idx = messages.indices.last {
                            messages[idx].sources = chunk.sources
                        }
                    case "meta":
                        conversationId = chunk.conversation_id
                    default: break
                    }
                }
            } catch {
                if let idx = messages.indices.last {
                    messages[idx].content = "⚠️ Error: \(error.localizedDescription)"
                }
            }
            isStreaming = false
        }
    }
}

// MARK: - Message Row

struct MessageRow: View {
    let message: ChatMessage
    var isStreaming: Bool = false

    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            if message.role == .user { Spacer(minLength: 60) }

            VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 6) {
                if message.role == .assistant {
                    Text(message.modelId ?? "Assistant")
                        .font(.caption2).foregroundStyle(.tertiary)
                }

                // Thinking
                if let thinking = message.thinking, !thinking.isEmpty {
                    DisclosureGroup("🧠 Chain of Thought") {
                        Text(thinking)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(10)
                    .background(Color(hex: 0x818CF8).opacity(0.05))
                    .overlay(
                        Rectangle().frame(width: 3).foregroundStyle(Color(hex: 0x818CF8)),
                        alignment: .leading
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                // Content
                Text(LocalizedStringKey(message.content + (isStreaming ? " ▊" : "")))
                    .textSelection(.enabled)
                    .padding(12)
                    .background(message.role == .user ? Color(hex: 0x1A1A28) : .clear)
                    .clipShape(RoundedRectangle(cornerRadius: 14))

                // Sources
                if let sources = message.sources, !sources.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 6) {
                            ForEach(Array(sources.enumerated()), id: \.1.id) { i, src in
                                Link(destination: URL(string: src.url) ?? URL(string: "about:blank")!) {
                                    HStack(spacing: 4) {
                                        Text("\(i + 1)").fontWeight(.bold)
                                        Text(String(src.title.prefix(25)))
                                    }
                                    .font(.caption2)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 4)
                                    .background(Color(hex: 0x1A1A28))
                                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.06)))
                                    .clipShape(Capsule())
                                    .foregroundStyle(Color(hex: 0x818CF8))
                                }
                            }
                        }
                    }
                }
            }

            if message.role == .assistant { Spacer(minLength: 40) }
        }
    }
}

// MARK: - Model Picker

struct ModelPickerSheet: View {
    let models: [ModelInfo]
    @Binding var selected: String
    @Environment(\.dismiss) private var dismiss

    var grouped: [(String, [ModelInfo])] {
        Dictionary(grouping: models, by: \.provider).sorted { $0.key < $1.key }
    }

    var body: some View {
        NavigationStack {
            List {
                ForEach(grouped, id: \.0) { provider, items in
                    Section(provider.capitalized) {
                        ForEach(items) { model in
                            Button {
                                selected = model.id
                                dismiss()
                            } label: {
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(model.display_name).fontWeight(.medium)
                                        HStack(spacing: 6) {
                                            if model.is_vision { Text("👁 Vision").font(.caption2) }
                                            if model.is_thinking { Text("🧠 Thinking").font(.caption2) }
                                        }
                                    }
                                    Spacer()
                                    if model.id == selected {
                                        Image(systemName: "checkmark.circle.fill").foregroundStyle(Color(hex: 0x818CF8))
                                    }
                                }
                            }
                            .foregroundStyle(.white)
                            .listRowBackground(Color(hex: 0x12121A))
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color(hex: 0x0A0A0F))
            .navigationTitle("Select Model")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
        }
    }
}

struct FeatureChip: View {
    let icon: String
    let label: String
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon).font(.caption2)
            Text(label).font(.caption2)
        }
        .padding(.horizontal, 10).padding(.vertical, 6)
        .background(Color(hex: 0x1A1A28))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.06)))
        .clipShape(Capsule())
        .foregroundStyle(.secondary)
    }
}
