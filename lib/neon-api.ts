import createClient from 'openapi-fetch';
import type { paths } from '@neondatabase/api-client';

if (!process.env.NEON_API_KEY) {
  throw new Error('NEON_API_KEY is not defined');
}

const neonApiClient = createClient<paths>({
  baseUrl: 'https://console.neon.tech/api/v2',
  headers: {
    Authorization: `Bearer ${process.env.NEON_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Create a new Neon project for a tenant
 */
export async function createTenantProject(
  tenantSlug: string,
  region: string = 'aws-us-east-2'
) {
  console.log(`📦 Creating Neon project for tenant: ${tenantSlug}`);

  try {
    // Create project
    const { data: project, error: projectError } = await neonApiClient.POST(
      '/projects',
      {
        body: {
          project: {
            name: `tenant-${tenantSlug}`,
            region_id: region,
          },
        },
      }
    );

    if (projectError || !project) {
      console.error('Project creation error:', projectError);
      throw new Error(`Failed to create Neon project: ${JSON.stringify(projectError)}`);
    }

    console.log(`✅ Created Neon project: ${project.project.id}`);

    // Get connection string
    const { data: connectionData, error: connError } = await neonApiClient.GET(
      '/projects/{project_id}/connection_uri',
      {
        params: {
          path: { project_id: project.project.id },
          query: {
            database_name: 'neondb',
            role_name: 'neondb_owner',
          },
        },
      }
    );

    if (connError || !connectionData?.uri) {
      console.error('Connection string error:', connError);
      throw new Error(`Failed to get connection string: ${JSON.stringify(connError)}`);
    }

    console.log(`✅ Retrieved connection string`);

    return {
      projectId: project.project.id,
      databaseName: 'neondb',
      connectionString: connectionData.uri,
    };
  } catch (error) {
    console.error('Error in createTenantProject:', error);
    throw error;
  }
}

/**
 * Delete a Neon project
 */
export async function deleteTenantProject(projectId: string) {
  console.log(`🗑️ Deleting Neon project: ${projectId}`);

  try {
    const { error } = await neonApiClient.DELETE('/projects/{project_id}', {
      params: {
        path: { project_id: projectId },
      },
    });

    if (error) {
      console.error('Project deletion error:', error);
      throw new Error(`Failed to delete project: ${JSON.stringify(error)}`);
    }

    console.log(`✅ Deleted Neon project: ${projectId}`);
  } catch (error) {
    console.error('Error in deleteTenantProject:', error);
    throw error;
  }
}

/**
 * Get project details
 */
export async function getProjectDetails(projectId: string) {
  try {
    const { data, error } = await neonApiClient.GET('/projects/{project_id}', {
      params: {
        path: { project_id: projectId },
      },
    });

    if (error || !data) {
      throw new Error(`Failed to get project: ${JSON.stringify(error)}`);
    }

    return data.project;
  } catch (error) {
    console.error('Error in getProjectDetails:', error);
    throw error;
  }
}

/**
 * List all projects (for debugging)
 */
export async function listProjects() {
  try {
    const { data, error } = await neonApiClient.GET('/projects');

    if (error || !data) {
      throw new Error(`Failed to list projects: ${JSON.stringify(error)}`);
    }

    return data.projects;
  } catch (error) {
    console.error('Error in listProjects:', error);
    throw error;
  }
}