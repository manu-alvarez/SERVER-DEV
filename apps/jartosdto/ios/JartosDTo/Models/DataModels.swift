import Foundation

/// Data models for the JartosDTo API.

// MARK: - Auth

struct LoginRequest: Codable {
    let email: String
    let password: String
}

struct RegisterRequest: Codable {
    let email: String
    let password: String
    let display_name: String?
}

struct AuthResponse: Codable {
    let access_token: String
    let user: User
}

struct User: Codable, Identifiable {
    let id: String
    let email: String
    let display_name: String?
    let role: String
}

// MARK: - Chat

struct ChatMessage: Identifiable, Equatable {
    let id: String
    var role: MessageRole
    var content: String
    var thinking: String?
    var sources: [Source]?
    var modelId: String?
    var createdAt: Date?

    static func == (lhs: ChatMessage, rhs: ChatMessage) -> Bool {
        lhs.id == rhs.id && lhs.content == rhs.content
    }
}

enum MessageRole: String, Codable {
    case user, assistant, system
}

struct Source: Codable, Identifiable {
    var id: String { url }
    let title: String
    let url: String
    let snippet: String
}

struct ChatCompletionRequest: Codable {
    let model: String
    let messages: [APIMessage]
    let stream: Bool
    let conversation_id: String?
    let web_search: Bool?
    let temperature: Double?
    let max_tokens: Int?
}

struct APIMessage: Codable {
    let role: String
    let content: String
}

// MARK: - Models

struct ModelInfo: Codable, Identifiable {
    let id: String
    let provider: String
    let display_name: String
    let is_vision: Bool
    let is_thinking: Bool
}

struct ModelsResponse: Codable {
    let models: [ModelInfo]
}

// MARK: - Conversations

struct Conversation: Codable, Identifiable {
    let id: String
    let title: String
    let model_id: String?
    let created_at: String
    let message_count: Int
}

// MARK: - Admin

struct AdminStats: Codable {
    let total_users: Int?
    let total_conversations: Int?
    let total_messages: Int?
    let total_documents: Int?
}

// MARK: - Stream Chunk

struct StreamChunk: Codable {
    let type: String
    let content: String?
    let sources: [Source]?
    let conversation_id: String?
}
