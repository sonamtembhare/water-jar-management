import app from "./app";
import { seed } from "./seed";

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    await seed();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
