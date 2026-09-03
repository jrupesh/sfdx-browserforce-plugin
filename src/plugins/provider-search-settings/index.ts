import type { Record as JsforceRecord } from '@jsforce/jsforce-node';
import { BrowserforcePlugin } from '../../plugin.js';
import { ProviderSearchSettingsPage } from './pages.js';

export const GENERATE_DPE_DEFINITION_QUERY =
  "SELECT Id, DeveloperName from BatchJobDefinition where ProcessGroup = 'DataProcessingEngine' and Type = 'Calc' and Status = 'Active' and DeveloperName LIKE  'ProviderSearch_Custom%' LIMIT 1";

interface BatchJobDefinitionRecord extends JsforceRecord {
  Id: string;
  DeveloperName: string;
  Type: string;
  Status: string;
  ProcessGroup: string;
  Description: string | null;
  Language: string | null;
}

export type Config = {
  generateDPEDefinition: boolean;
  manualDataSync?: boolean;
};

export class ProviderSearchSettings extends BrowserforcePlugin {
  public async retrieve(definition?: Config): Promise<Config> {
    return {
      generateDPEDefinition: (await this.getProviderSearchDefinition()) !== undefined,
      // Keep this aligned with requested definition so diff only triggers on true state changes.
      manualDataSync: definition?.manualDataSync ?? false,
    };
  }

  public async apply(config: Config): Promise<void> {
    if (!config.generateDPEDefinition) {
      return;
    }

    await using page = await this.browserforce.openPage(ProviderSearchSettingsPage.getUrl());
    const providerSearchSettings = new ProviderSearchSettingsPage(page);
    await providerSearchSettings.generateDpeDefinition(
      async () => (await this.getProviderSearchDefinition()) !== undefined,
    );

    if (config.manualDataSync) {
      await this.runDataProcessingEngineDefinition();
    }
  }

  private async getProviderSearchDefinition(): Promise<BatchJobDefinitionRecord | undefined> {
    const result =
      await this.browserforce.connection.tooling.query<BatchJobDefinitionRecord>(GENERATE_DPE_DEFINITION_QUERY);
    return result.records?.[0];
  }

  private async runDataProcessingEngineDefinition(): Promise<void> {
    const definition = await this.getProviderSearchDefinition();
    if (!definition?.DeveloperName) {
      throw new Error('Could not find active Provider Search DPE definition after generation.');
    }

    const endpoint = this.getDataProcessingEngineActionEndpoint(definition.DeveloperName);
    const actionDescription = await this.browserforce.connection.request<unknown>(endpoint);
    const body = buildRunDefinitionRequestBody(actionDescription);
    const runResponse = await this.browserforce.connection.request<unknown>({
      method: 'POST',
      url: endpoint,
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const batchJobId = extractBatchJobId(runResponse);
    if (!batchJobId) {
      throw new Error(`Could not determine batch job id from DPE run response: ${JSON.stringify(runResponse)}`);
    }
    this.browserforce.logger?.log(`Started Provider Search DPE batch job: ${batchJobId}`);
  }

  private getDataProcessingEngineActionEndpoint(developerName: string): string {
    const apiVersion = this.browserforce.connection.version;
    if (!apiVersion) {
      throw new Error('Missing API version on Salesforce connection.');
    }
    return `/services/data/v${apiVersion}/actions/custom/dataProcessingEngineAction/${encodeURIComponent(developerName)}`;
  }
}

function buildRunDefinitionRequestBody(actionDescription: unknown): { inputs: Record<string, unknown>[] } {
  const defaultInput = extractInputValues(actionDescription);
  return {
    inputs: [defaultInput],
  };
}

type ActionInputDefinition = {
  name?: string;
  defaultValue?: unknown;
  value?: unknown;
};

function extractInputValues(actionDescription: unknown): Record<string, unknown> {
  if (typeof actionDescription !== 'object' || actionDescription === null) {
    return {};
  }

  const description = actionDescription as {
    actions?: Array<{ inputs?: unknown }>;
    inputs?: unknown;
  };

  const actionInputs = description.actions?.[0]?.inputs;
  if (Array.isArray(actionInputs)) {
    return mapInputDefinitions(actionInputs);
  }

  if (Array.isArray(description.inputs)) {
    return mapInputDefinitions(description.inputs);
  }

  return {};
}

function mapInputDefinitions(inputDefs: unknown[]): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  for (const rawInputDef of inputDefs) {
    if (!isPlainObject(rawInputDef)) {
      continue;
    }

    const inputDef = rawInputDef as ActionInputDefinition;
    const name = typeof inputDef.name === 'string' ? inputDef.name : undefined;
    if (!name) {
      continue;
    }

    if (inputDef.defaultValue !== undefined && inputDef.defaultValue !== null) {
      mapped[name] = inputDef.defaultValue;
    } else if (inputDef.value !== undefined && inputDef.value !== null) {
      mapped[name] = inputDef.value;
    } else {
      mapped[name] = '';
    }
  }
  return mapped;
}

function extractBatchJobId(response: unknown): string | undefined {
  const queue: unknown[] = [response];

  while (queue.length > 0) {
    const current = queue.shift();
    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }
    if (!isPlainObject(current)) {
      continue;
    }
    if (typeof current.batchJobId === 'string') {
      return current.batchJobId;
    }
    if (isPlainObject(current.outputValues) && typeof current.outputValues.batchJobId === 'string') {
      return current.outputValues.batchJobId;
    }
    if (Array.isArray(current.results)) {
      queue.push(...current.results);
    }
  }

  return undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
