import app from "../src/app";
import { seed } from "../src/seed";

let isSeeded = false;

export default async function handler(req: any, res: any) {
    if (!isSeeded) {
        await seed();
        isSeeded = true;
    }
    return app(req, res);
}
