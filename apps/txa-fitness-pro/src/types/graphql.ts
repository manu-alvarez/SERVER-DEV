export const typeDefs = `
  # Enums
  enum PlanStatus { DRAFT ACTIVE ARCHIVED NEEDS_REVIEW }
  enum ModuleType { WISDOM STRENGTH CARDIO SLEEP_HYGIENE }
  enum ActivityType { CALISTHENICS CARDIO STRETCH HABIT_TRACKING }
  enum ActivityStatus { PENDING COMPLETED SKIPPED FAILED }

  # Core Domain
  type User {
    id: UUID!
    email: String!
    createdAt: DateTime!
    lastCompletedAssessment: DateTime
    coachingPlan: CoachingPlan
    metadata: JSON
  }

  type Assessment {
    id: ID!
    userId: UUID!
    score: Float!
    createdAt: DateTime!
    diagnosticReport: DiagnosticReport
  }

  type CoachingPlan {
    id: ID!
    userId: UUID!
    assessmentId: ID!
    status: PlanStatus!
    goal: String!
    moduleStructure: [CoachingModule!]!
    summary: String!
    lastReviewed: DateTime
  }

  type CoachingModule {
    id: ID!
    planId: ID!
    title: String!
    description: String!
    moduleType: ModuleType!
    requiredPrerequisites: [CoachingModule!]
    activities: [Activity!]!
    difficultyMultiplier: Float!
  }

  type Activity {
    id: ID!
    moduleId: ID!
    type: ActivityType!
    title: String!
    instructions: String!
    expectedMetrics: [Metric!]!
    videoAssets: [Asset!]!
    status: ActivityStatus!
    completionLog: ActivityCompletionLog
  }

  type Metric {
    fieldName: String!
    unit: String!
    isCalculated: Boolean!
  }

  type Asset {
    url: String!
    type: String!
    title: String!
  }

  type ActivityCompletionLog {
    id: ID!
    activityId: ID!
    userId: UUID!
    metrics: JSON!
    completionStatus: String!
    completedAt: DateTime!
    notes: String
  }

  type DiagnosticReport {
    id: ID!
    userId: UUID!
    assessmentScore: Float!
    weakAreas: [WeaknessArea!]!
    recommendedModules: [CoachingModule!]!
    completionTimeSeconds: Int!
  }

  type WeaknessArea {
    areaName: String!
    severity: Int!
    suggestedMetrics: [String!]!
    justification: String!
  }

  # Inputs
  input AnswerSubmissionInput {
    questionId: String!
    selectedOptionId: String!
    value: Float!
    userContext: JSON
  }

  # Queries
  type Query {
    currentUser: User
    assessment(id: ID!): Assessment
    coachingPlan(userId: UUID!): CoachingPlan
    module(id: ID!): CoachingModule
    activity(id: ID!): Activity
    diagnosticReport(assessmentId: ID!): DiagnosticReport
  }

  # Mutations
  type Mutation {
    submitAssessment(answers: [AnswerSubmissionInput!]!): DiagnosticReport!
    updateActivityLog(activityId: ID!, metrics: JSON!, status: String!): ActivityCompletionLog!
    updateCoachingPlanStatus(planId: ID!, status: PlanStatus!): CoachingPlan!
  }

  # Scalars
  scalar UUID
  scalar DateTime
  scalar JSON
`;
