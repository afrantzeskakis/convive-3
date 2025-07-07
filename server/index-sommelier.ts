/**
 * Add this code to your server/index.ts file to register the sommelier routes
 */

// Import the sommelier routes setup function
import { setupSommelierRoutes } from './routes/sommelier-routes';

// In your server setup, register the sommelier routes
const router = express.Router();
setupSommelierRoutes(router);
app.use('/', router);