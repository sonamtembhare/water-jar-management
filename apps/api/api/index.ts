import app from "../src/app";
import { runSeed } from "../src/seed";

let isSeeded = false;

export default async function handler(req: any, res: any) {
    if (!isSeeded) {
        await runSeed();
        isSeeded = true;
    }
    return app(req, res);
}
