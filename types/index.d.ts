export interface IConfig {
  min_delay: number;
  max_delay: number;
  name: string;
  endpoint: string;
  user_agent: string;
  headless: boolean;
  devtools: boolean;
  timeout: number;
  ignore_resource_types: string[];
  max_tries: number;
  proxies: string[];
}

export interface IIdentifier {
  id: number;
  identifier: string;
}

export interface IQueueItem {
  tries: number;
  identifier: IIdentifier;
}
