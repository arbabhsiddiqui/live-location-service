import express from 'express';
import type { Express } from 'express';
import cookieParser from "cookie-parser";
import { AuthRouter } from './auth/auth.routes';

export function createExpressApplication(): Express {
    const app = express();

    app.use(express.json());
    app.use(cookieParser());

    // Initialize the Router
    const authRouter = new AuthRouter();

    // Landing Page (Public)
    app.get('/', (req, res) => {
        res.send('<h1>Home</h1><a href="http://localhost:6001/api/v1/auth/authorize?client_id=project2&redirect_uri=http://localhost:4000/callback&state=xyz">Login</a>');
    });

    // Mount the Auth Router
    // Note: If you use app.use('/auth', authRouter.router), 
    // your URLs become /auth/callback, etc. 
    // For now, we mount it at root to match your OIDC config.
    app.use(authRouter.router);

    return app;
}