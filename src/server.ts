import express from "express";
import router from "./presentation/routes";

const app = express();
app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`CinéResa sur http://localhost:${PORT}`));
}

export default app;