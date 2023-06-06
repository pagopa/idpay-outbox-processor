import { readFile } from "fs";
import * as yaml from "js-yaml";

let config: any | undefined;

export default config;
export async function getConfiguration(): Promise<any> {
    if (!config) {
        config = await loadConfiguration();
    }
    return config;
}

async function loadConfiguration(): Promise<any> {
    const configFile = await new Promise<string>((resolve, reject) => {
        readFile("config.yaml", "utf-8", (err, data) => {
            if (err) { reject(err); } else { resolve(data) };
        });
    });
    const config = yaml.load(configFile) as any;
    // Function to evaluate the expression
    const evaluateExpression = (expression: string) => {
        const regex = /\$\{([^\}]+)\}/g;
        const match = regex.exec(expression);
        if (match) {
            const envVariable = match[1];
            const firstColon = envVariable.indexOf(':');
            if (firstColon > 0) {
                const variable = envVariable.substring(0, firstColon);
                const fallback = envVariable.substring(firstColon + 1);
                return process.env[variable.trim()] || fallback?.trim();
            } else {
                return process.env[envVariable];
            }
        }
        return expression;
    };

    // Evaluate expressions in the configuration object
    const evaluateConfig = (obj: any) => {
        if (typeof obj === 'object') {
            for (const key in obj) {
                if (typeof obj[key] === 'object') {
                    evaluateConfig(obj[key]);
                } else if (typeof obj[key] === 'string') {
                    obj[key] = evaluateExpression(obj[key]);
                }
            }
        }
    };
    // Evaluate expressions in the configuration
    evaluateConfig(config);
    return config;
}