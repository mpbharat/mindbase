interface SaveOptions {
    summary: string;
    memory: string[];
    next?: string;
    duration: string;
}
export declare function runSave(options: SaveOptions): Promise<void>;
export {};
