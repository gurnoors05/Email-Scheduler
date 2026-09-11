import prisma from '../config/prisma';

export async function notifyRateLimitHit(userId: string, senderEmail: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { slackAccessToken: true, slackChannelId: true },
    });

    if (!user || !user.slackAccessToken) {
      console.log(`Slack not connected for user ${userId}, skipping notification`);
      return;
    }

    // Call Slack API with a 5-second timeout
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.slackAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: user.slackChannelId,
        text: `⚠️ Rate limit reached for sender ${senderEmail}. Remaining emails will be sent in the next available window.`,
      }),
      signal: AbortSignal.timeout(5000),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Slack chat.postMessage failed:', data.error);
    }
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    // Explicitly catching and swallowing errors so we never crash the caller
  }
}
