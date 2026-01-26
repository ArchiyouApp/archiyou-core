import init, { OpenCascadeInstance } from "./archiyou-opencascade";
export * from "./archiyou-opencascade";

type OpenCascadeModuleObject = {
  [key: string]: any;
};

export function initOpenCascade(
  settings?: {
    mainJS?: init;
    mainWasm?: string;
    worker?: string;
    libs?: string[];
    module?: OpenCascadeModuleObject;
  },
): Promise<OpenCascadeInstance>;