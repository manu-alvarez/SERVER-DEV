import Foundation

/// API client for the JartosDTo FastAPI backend.
@Observable
final class APIService {
    static let shared = APIService()

    #if targetEnvironment(simulator)
    var baseURL = "http://localhost:8100/api/v1"
    #else
    var baseURL = "http://msbross.me:8100/api/v1"
    #endif

    var token: String? {
        didSet { UserDefaults.standard.set(token, forKey: "auth_token") }
    }
    var currentUser: User?

    private init() {
        self.token = UserDefaults.standard.string(forKey: "auth_token")
    }

    var isAuthenticated: Bool { token != nil }

    // MARK: - Generic Request

    private func request<T: Decodable>(
        _ path: String,
        method: String = "GET",
        body: (any Encodable)? = nil
    ) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(path)") else {
            throw APIError.invalidURL
        }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let t = token {
            req.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            req.httpBody = try JSONEncoder().encode(body)
        }
        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse, 200...299 ~= http.statusCode else {
            throw APIError.serverError((response as? HTTPURLResponse)?.statusCode ?? 0)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    // MARK: - Auth

    func login(email: String, password: String) async throws {
        let res: AuthResponse = try await request("/auth/login", method: "POST", body: LoginRequest(email: email, password: password))
        token = res.access_token
        currentUser = res.user
    }

    func register(email: String, password: String, name: String?) async throws {
        let res: AuthResponse = try await request("/auth/register", method: "POST", body: RegisterRequest(email: email, password: password, display_name: name))
        token = res.access_token
        currentUser = res.user
    }

    func getMe() async throws {
        currentUser = try await request("/auth/me")
    }

    func logout() {
        token = nil
        currentUser = nil
    }

    // MARK: - Models

    func getModels() async throws -> [ModelInfo] {
        let res: ModelsResponse = try await request("/models/")
        return res.models
    }

    // MARK: - Conversations

    func getConversations() async throws -> [Conversation] {
        try await request("/conversations/")
    }

    func deleteConversation(_ id: String) async throws {
        let _: EmptyResponse = try await request("/conversations/\(id)", method: "DELETE")
    }

    // MARK: - Admin

    func getAdminStats() async throws -> AdminStats {
        try await request("/admin/stats")
    }

    // MARK: - Streaming Chat

    func streamChat(
        model: String,
        messages: [APIMessage],
        conversationId: String? = nil,
        webSearch: Bool = false,
        temperature: Double = 0.7,
        maxTokens: Int = 4096
    ) -> AsyncThrowingStream<StreamChunk, Error> {
        AsyncThrowingStream { continuation in
            Task {
                guard let url = URL(string: "\(baseURL.replacingOccurrences(of: "/api/v1", with: ""))/api/v1/chat/completions") else {
                    continuation.finish(throwing: APIError.invalidURL)
                    return
                }

                var req = URLRequest(url: url)
                req.httpMethod = "POST"
                req.setValue("application/json", forHTTPHeaderField: "Content-Type")
                if let t = token {
                    req.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization")
                }

                let body = ChatCompletionRequest(
                    model: model,
                    messages: messages,
                    stream: true,
                    conversation_id: conversationId,
                    web_search: webSearch,
                    temperature: temperature,
                    max_tokens: maxTokens
                )
                req.httpBody = try? JSONEncoder().encode(body)

                do {
                    let (bytes, _) = try await URLSession.shared.bytes(for: req)
                    for try await line in bytes.lines {
                        guard line.hasPrefix("data: ") else { continue }
                        let json = String(line.dropFirst(6))
                        guard let data = json.data(using: .utf8),
                              let chunk = try? JSONDecoder().decode(StreamChunk.self, from: data) else { continue }
                        continuation.yield(chunk)
                        if chunk.type == "done" { break }
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }
}

struct EmptyResponse: Codable {}

enum APIError: LocalizedError {
    case invalidURL
    case serverError(Int)

    var errorDescription: String? {
        switch self {
        case .invalidURL: "Invalid URL"
        case .serverError(let code): "Server error: \(code)"
        }
    }
}
