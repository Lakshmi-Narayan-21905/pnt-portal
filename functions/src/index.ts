import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import { validateFirebaseIdToken } from "./middleware/authMiddleware";
import { App as UserApp } from "./controllers/userController";

import { App as CompanyApp } from "./controllers/companyController";

import { App as AuthApp } from "./controllers/authController";
import { App as TrainingApp } from "./controllers/trainingController";
import { App as PlacementApp } from "./controllers/placementController";
import { App as AnnouncementApp } from "./controllers/announcementController";

// Initialize Express App
const app = express();
app.use(cors({ origin: true }));
app.use(validateFirebaseIdToken);

// Routes
app.use("/users", UserApp);
app.use("/companies", CompanyApp);
app.use("/auth", AuthApp);
app.use("/trainings", TrainingApp);
app.use("/placements", PlacementApp);
app.use("/announcements", AnnouncementApp);

// Export the API
export const api = functions.https.onRequest(app);
