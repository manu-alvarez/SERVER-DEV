import { createYoga, createSchema } from 'graphql-yoga';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

const typeDefs = `
  type Query {
    hello: String!
    getUserPlan: CoachingPlan
  }

  type Mutation {
    createPlan(goal: String!): CoachingPlan
  }

  type CoachingPlan {
    id: ID!
    goal: String!
    status: String!
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL Yoga!',
    getUserPlan: async (_parent: any, _args: any, context: any) => {
      const { user } = context;
      if (!user) return null;
      
      const data = await prisma.coachingPlan.findFirst({
        where: { userId: user.id }
      });
      return data;
    }
  },
  Mutation: {
    createPlan: async (_parent: any, args: any, context: any) => {
      const { user } = context;
      if (!user) throw new Error('Not authenticated');

      const data = await prisma.coachingPlan.create({
        data: {
          userId: user.id,
          goal: args.goal,
          status: 'ACTIVE',
          assessmentId: crypto.randomUUID()
        }
      });
      return data;
    }
  }
};

const { handleRequest } = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers
  }),
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
  context: async (req: NextRequest) => {
    // Next-auth session check
    const session = await getServerSession();
    return { 
      user: session?.user || null, 
      req 
    };
  }
});

async function handler(request: NextRequest, context: any) {
  return handleRequest(request, context);
}

export { handler as GET, handler as POST, handler as OPTIONS };
