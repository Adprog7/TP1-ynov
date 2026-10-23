import { buildApp, chooseAdapters } from "./container";

const PORT = process.env.PORT || 3000;
buildApp(chooseAdapters()).listen(PORT, () => console.log(`CinéResa sur http://localhost:${PORT}`));