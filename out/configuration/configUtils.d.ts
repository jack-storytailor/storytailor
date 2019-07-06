import { IStsConfig } from '../shared/IStsConfig';
export declare const loadConfig: (configPath: string) => IStsConfig;
export declare const loadConfig2: (configPath: string) => {
    isSuccess: boolean;
    config: IStsConfig;
    errors: string[];
};
