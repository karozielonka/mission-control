import type {
  LinearAttachment,
  LinearHistoryEntry,
  LinearIssue,
} from './types/linear.js';

const LINEAR_API_URL = 'https://api.linear.app/graphql';

const getApiKey = (): string => process.env.LINEAR_API_KEY || '';

export const isLinearConfigured = (): boolean => !!process.env.LINEAR_API_KEY;

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function linearFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      Authorization: getApiKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Linear API error ${response.status}: ${body}`);
  }

  const json = (await response.json()) as GraphQLResponse<T>;
  if (json.errors && json.errors.length > 0) {
    throw new Error(`Linear GraphQL error: ${json.errors.map((e) => e.message).join('; ')}`);
  }
  if (!json.data) {
    throw new Error('Linear GraphQL response missing data');
  }
  return json.data;
}

const ISSUE_FIELDS = `
  id
  identifier
  title
  description
  url
  estimate
  priority
  priorityLabel
  state { name type }
  assignee { id name email }
  labels { nodes { name } }
  children { nodes { id identifier title state { name type } } }
`;

export async function getMyIssues(): Promise<LinearIssue[]> {
  const query = `
    query MyIssues {
      viewer {
        assignedIssues(
          filter: { state: { type: { nin: ["completed", "canceled"] } } }
          orderBy: updatedAt
          first: 100
        ) {
          nodes { ${ISSUE_FIELDS} }
        }
      }
    }
  `;

  const data = await linearFetch<{ viewer: { assignedIssues: { nodes: LinearIssue[] } } }>(query);
  return data.viewer.assignedIssues.nodes;
}

export async function getUnassignedTestingIssues(): Promise<LinearIssue[]> {
  const query = `
    query UnassignedTesting {
      issues(
        filter: {
          assignee: { null: true },
          state: { name: { containsIgnoreCase: "testing" } }
        }
        first: 100
      ) {
        nodes { ${ISSUE_FIELDS} }
      }
    }
  `;

  const data = await linearFetch<{ issues: { nodes: LinearIssue[] } }>(query);
  return data.issues.nodes;
}

export async function getCyclePickupCandidates(): Promise<LinearIssue[]> {
  const query = `
    query CyclePickupCandidates {
      issues(
        filter: {
          cycle: { isActive: { eq: true } },
          assignee: { null: true },
          state: { type: { in: ["triage", "backlog", "unstarted"] } }
        }
        first: 100
      ) {
        nodes { ${ISSUE_FIELDS} }
      }
    }
  `;

  const data = await linearFetch<{ issues: { nodes: LinearIssue[] } }>(query);
  return data.issues.nodes;
}

export async function getAttachments(issueId: string): Promise<LinearAttachment[]> {
  const query = `
    query Attachments($id: String!) {
      issue(id: $id) {
        attachments(first: 50) {
          nodes { id url title }
        }
      }
    }
  `;

  const data = await linearFetch<{ issue: { attachments: { nodes: LinearAttachment[] } } }>(
    query,
    { id: issueId }
  );
  return data.issue.attachments.nodes;
}

export async function getIssueHistory(issueId: string): Promise<LinearHistoryEntry[]> {
  const query = `
    query History($id: String!) {
      issue(id: $id) {
        history(first: 100) {
          nodes {
            createdAt
            fromState { name }
            toState { name }
          }
        }
      }
    }
  `;

  const data = await linearFetch<{ issue: { history: { nodes: LinearHistoryEntry[] } } }>(query, {
    id: issueId,
  });
  return data.issue.history.nodes;
}
