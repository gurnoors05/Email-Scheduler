import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Credential is required' });
    }

    // Verify token with google-auth-library
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      return res.status(400).json({ message: 'Invalid Google token payload' });
    }

    const { sub: googleId, email, name, picture: avatarUrl } = payload;

    // Upsert User by googleId
    const user = await prisma.user.upsert({
      where: { googleId },
      update: {
        name: name || '',
        email,
        avatarUrl,
      },
      create: {
        googleId,
        email,
        name: name || '',
        avatarUrl,
      },
    });

    // Issue JWT
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      slackConnected: !!user.slackAccessToken
    };

    return res.status(200).json({ user: userResponse, token });
  } catch (error: any) {
    console.error('Google Auth Error:', error.message);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      slackConnected: !!user.slackAccessToken
    };

    return res.status(200).json(userResponse);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const logout = (req: Request, res: Response) => {
  // Stateless JWT, frontend handles deletion
  return res.status(200).json({ message: 'Logged out successfully' });
};

export const slackAuthRedirect = (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  // Sign the state parameter to prevent CSRF / tampering
  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
  const state = jwt.sign({ userId }, jwtSecret, { expiresIn: '15m' });

  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/auth/slack/callback';

  // We request chat:write only, and store authed_user.id for DM routing
  const slackUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=chat:write&user_scope=&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;

  return res.redirect(302, slackUrl);
};

export const slackAuthCallback = async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { code, state, error } = req.query;

  if (error || !code || !state) {
    return res.redirect(302, `${frontendUrl}/?slack=error`);
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    // Verify the state token and recover the userId
    const decoded = jwt.verify(state as string, jwtSecret) as { userId: string };
    const userId = decoded.userId;

    const clientId = process.env.SLACK_CLIENT_ID!;
    const clientSecret = process.env.SLACK_CLIENT_SECRET!;
    const redirectUri = process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/auth/slack/callback';

    // Exchange code for token via standard fetch
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code as string,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      console.error('Slack OAuth Exchange Error:', tokenData.error);
      return res.redirect(302, `${frontendUrl}/?slack=error`);
    }

    const slackAccessToken = tokenData.access_token;
    const slackTeamId = tokenData.team?.id;
    // Use authed_user.id as the target DM channel
    const slackChannelId = tokenData.authed_user?.id;

    // Update the User row
    await prisma.user.update({
      where: { id: userId },
      data: {
        slackAccessToken,
        slackTeamId,
        slackChannelId,
      },
    });

    return res.redirect(302, `${frontendUrl}/?slack=connected`);
  } catch (err) {
    console.error('Slack OAuth Callback Error:', err);
    return res.redirect(302, `${frontendUrl}/?slack=error`);
  }
};
