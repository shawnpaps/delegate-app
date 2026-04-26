import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the project root (two levels up from src/index.ts)
config({ path: join(__dirname, "..", ".env") });

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import Mailgun from "mailgun.js";
import FormData from "form-data";

const app = new Hono();

// Mailgun configuration
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || "";
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || "";
const CONVEX_HTTP_URL = process.env.CONVEX_HTTP_URL || "";
const CONVEX_ADMIN_KEY = process.env.CONVEX_ADMIN_KEY || "";

// Debug logging
console.log("Mailgun config:", {
  domain: MAILGUN_DOMAIN,
  hasApiKey: !!MAILGUN_API_KEY,
  apiKeyLength: MAILGUN_API_KEY?.length || 0,
});

// Initialize Mailgun SDK client
const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: 'api',
  key: MAILGUN_API_KEY,
  url: 'https://api.mailgun.net'
});
console.log("[DEBUG] Mailgun SDK client initialized successfully");

// Helper function to send email via Mailgun SDK
async function sendMailgunEmail(params: {
  to: string;
  from: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  console.log("[DEBUG] sendMailgunEmail called with:", { to: params.to, from: params.from, subject: params.subject });
  
  try {
    const messageData: any = {
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    };
    
    if (params.replyTo) {
      messageData['h:Reply-To'] = params.replyTo;
    }
    
    console.log("[DEBUG] Sending email via Mailgun SDK to domain:", MAILGUN_DOMAIN);
    console.log("[DEBUG] Message data:", JSON.stringify(messageData, null, 2));
    
    const result = await mg.messages.create(MAILGUN_DOMAIN, messageData);
    
    console.log("[DEBUG] Mailgun SDK success response:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("[DEBUG] Error in sendMailgunEmail:", error);
    if (error instanceof Error) {
      console.error("[DEBUG] Error message:", error.message);
      console.error("[DEBUG] Error stack:", error.stack);
    }
    throw error;
  }
}

// Helper function to send assignee email
async function sendAssigneeEmail(params: {
  to: string;
  taskTitle: string;
  taskDescription?: string;
  creatorName: string;
  creatorEmail: string;
  emailToken: string;
}) {
  console.log("[DEBUG] sendAssigneeEmail called with:", JSON.stringify(params, null, 2));
  
  const html = generateAssigneeEmailHtml({
    taskTitle: params.taskTitle,
    taskDescription: params.taskDescription,
    creatorName: params.creatorName,
    creatorEmail: params.creatorEmail,
    emailToken: params.emailToken,
  });

  console.log("[DEBUG] Generated HTML email content, calling sendMailgunEmail...");

  try {
    await sendMailgunEmail({
      from: `Delegate <tasks@${MAILGUN_DOMAIN}>`,
      to: params.to,
      subject: `New task assigned: ${params.taskTitle}`,
      html,
      replyTo: `complete+${params.emailToken}@${MAILGUN_DOMAIN}`,
    });
    console.log("[DEBUG] sendAssigneeEmail completed successfully");
  } catch (error) {
    console.error("[DEBUG] sendAssigneeEmail failed:", error);
    throw error;
  }
}

// Generate HTML for assignee email
function generateAssigneeEmailHtml(params: {
  taskTitle: string;
  taskDescription?: string;
  creatorName: string;
  creatorEmail: string;
  emailToken: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Task Assigned</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">📦 New Task Assigned</h1>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi there,</p>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                <strong>${escapeHtml(params.creatorName || "Someone")}</strong>${params.creatorEmail ? ` (${escapeHtml(params.creatorEmail)})` : ""} has assigned you a new task:
              </p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 0 0 24px 0;">
                <h2 style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 12px 0;">${escapeHtml(params.taskTitle)}</h2>
                ${params.taskDescription ? `<p style="color: #64748b; font-size: 14px; line-height: 22px; margin: 0 0 16px 0;">${escapeHtml(params.taskDescription)}</p>` : ''}
              </div>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                To complete this task, simply reply to this email with the word <strong>"complete"</strong>.
              </p>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                Alternatively, you can reply with any message that includes the word "complete".
              </p>
              
              <p style="color: #94a3b8; font-size: 12px; margin: 32px 0 0 0; text-align: center;">
                This task was sent via Delegate - Lightweight delegation for small business owners.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Helper function to escape HTML special characters
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper function to send reminder email
async function sendReminderEmail(params: {
  to: string;
  taskTitle: string;
  taskDescription?: string;
  assigneeName?: string;
  assigneeEmail: string;
  createdAt: string;
}) {
  const html = generateReminderEmailHtml({
    taskTitle: params.taskTitle,
    taskDescription: params.taskDescription,
    assigneeName: params.assigneeName,
    assigneeEmail: params.assigneeEmail,
    createdAt: params.createdAt,
  });

  await sendMailgunEmail({
    from: `Delegate <reminders@${MAILGUN_DOMAIN}>`,
    to: params.to,
    subject: `Reminder: ${params.taskTitle}`,
    html,
  });
}

// Generate HTML for reminder email
function generateReminderEmailHtml(params: {
  taskTitle: string;
  taskDescription?: string;
  assigneeName?: string;
  assigneeEmail: string;
  createdAt: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">⏰ Task Reminder</h1>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi there,</p>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">This is a friendly reminder to follow up on the task you assigned.</p>
              
              <div style="background-color: #fef3f2; border: 1px solid #fecaca; border-radius: 8px; padding: 24px; margin: 0 0 24px 0;">
                <h2 style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 12px 0;">${escapeHtml(params.taskTitle)}</h2>
                ${params.taskDescription ? `<p style="color: #64748b; font-size: 14px; line-height: 22px; margin: 0 0 16px 0;">${escapeHtml(params.taskDescription)}</p>` : ''}
                <p style="color: #64748b; font-size: 14px; margin: 0;">
                  Assigned to: <strong>${escapeHtml(params.assigneeName || params.assigneeEmail)}</strong><br>
                  Assigned on: ${escapeHtml(params.createdAt)}
                </p>
              </div>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">The assignee should reply to the assignment email with "complete" when finished.</p>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">If you haven't received a completion confirmation, consider reaching out directly.</p>
              
              <p style="color: #94a3b8; font-size: 12px; margin: 32px 0 0 0; text-align: center;">
                This reminder was sent via Delegate - Lightweight delegation for small business owners.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Helper function to send completion confirmation
async function sendCompletionConfirmation(params: {
  to: string;
  taskTitle: string;
  assigneeName?: string;
  assigneeEmail: string;
  completedAt: string;
}) {
  const html = generateCompletionEmailHtml({
    taskTitle: params.taskTitle,
    assigneeName: params.assigneeName,
    assigneeEmail: params.assigneeEmail,
    completedAt: params.completedAt,
  });

  await sendMailgunEmail({
    from: `Delegate <notifications@${MAILGUN_DOMAIN}>`,
    to: params.to,
    subject: `Task completed: ${params.taskTitle}`,
    html,
  });
}

// Generate HTML for completion confirmation email
function generateCompletionEmailHtml(params: {
  taskTitle: string;
  assigneeName?: string;
  assigneeEmail: string;
  completedAt: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Completed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">✅ Task Completed</h1>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi there,</p>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Good news! The task has been marked as completed.</p>
              
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 24px; margin: 0 0 24px 0;">
                <h2 style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 12px 0;">${escapeHtml(params.taskTitle)}</h2>
                <p style="color: #64748b; font-size: 14px; margin: 0;">
                  Completed by: <strong>${escapeHtml(params.assigneeName || params.assigneeEmail)}</strong><br>
                  Completed at: ${escapeHtml(params.completedAt)}
                </p>
              </div>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">No further action is required for this task.</p>
              
              <p style="color: #94a3b8; font-size: 12px; margin: 32px 0 0 0; text-align: center;">
                Sent via Delegate - Lightweight delegation for small business owners.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Health check
app.get("/", (c) => {
  return c.json({ message: "Delegate Email Service" });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Send assignee email when task is created
app.post("/api/send-assignee-email", async (c) => {
  try {
    const body = await c.req.json();
    console.log("[DEBUG] Received send-assignee-email request:", JSON.stringify(body, null, 2));
    
    const { to, taskTitle, taskDescription, creatorName, creatorEmail, emailToken } = body;

    if (!to || !taskTitle || !emailToken) {
      console.error("[DEBUG] Missing required fields:", { to, taskTitle, emailToken });
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    // Use fallback values if creator info is missing
    const effectiveCreatorEmail = creatorEmail || "noreply@delegate.app";
    const effectiveCreatorName = creatorName || "Someone";

    console.log("[DEBUG] Sending assignee email to:", to, "from:", effectiveCreatorEmail);
    await sendAssigneeEmail({
      to,
      taskTitle,
      taskDescription,
      creatorName: effectiveCreatorName,
      creatorEmail: effectiveCreatorEmail,
      emailToken,
    });

    console.log("[DEBUG] Email sent successfully to:", to);
    return c.json({ success: true });
  } catch (error) {
    console.error("[DEBUG] Failed to send assignee email:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[DEBUG] Error details:", errorMessage);
    return c.json({ error: "Failed to send email", details: errorMessage }, 500);
  }
});

// Send reminder email
app.post("/api/send-reminder", async (c) => {
  try {
    const body = await c.req.json();
    const { to, taskTitle, taskDescription, assigneeName, assigneeEmail, createdAt } = body;

    if (!to || !taskTitle || !assigneeEmail || !createdAt) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    await sendReminderEmail({
      to,
      taskTitle,
      taskDescription,
      assigneeName,
      assigneeEmail,
      createdAt,
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to send reminder email:", error);
    return c.json({ error: "Failed to send email" }, 500);
  }
});

// Send completion confirmation email
app.post("/api/send-completion-confirmation", async (c) => {
  try {
    const body = await c.req.json();
    const { to, taskTitle, assigneeName, assigneeEmail, completedAt } = body;

    if (!to || !taskTitle || !assigneeEmail || !completedAt) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    await sendCompletionConfirmation({
      to,
      taskTitle,
      assigneeName,
      assigneeEmail,
      completedAt,
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to send completion confirmation:", error);
    return c.json({ error: "Failed to send email" }, 500);
  }
});

// Mailgun webhook for incoming emails
app.post("/api/webhook/email", async (c) => {
  try {
    const body = await c.req.formData();

    const from = body.get("from") as string;
    const to = (body.get("recipient") as string) || (body.get("To") as string);
    const subject = body.get("subject") as string;
    const textBody = (body.get("body-plain") as string) || (body.get("stripped-text") as string);
    const htmlBody = (body.get("body-html") as string) || (body.get("stripped-html") as string);

    console.log("Received email webhook:", { from, to, subject });

    // Extract token from recipient email (format: complete+TOKEN@domain.com)
    const tokenMatch = to?.match(/complete\+([^@]+)@/);
    if (!tokenMatch) {
      console.log("No completion token found in recipient:", to);
      return c.json({ success: true, message: "No token found, ignored" });
    }

    const emailToken = tokenMatch[1];

    // Check if email body contains "complete"
    const emailContent = (textBody || htmlBody || "").toLowerCase();
    if (!emailContent.includes("complete")) {
      console.log("Email does not contain 'complete' keyword");
      return c.json({ success: true, message: "No completion keyword found" });
    }

    // Call Convex to complete the task
    const response = await fetch(`${CONVEX_HTTP_URL}/api/complete-task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CONVEX_ADMIN_KEY}`,
      },
      body: JSON.stringify({ emailToken }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to complete task:", error);
      return c.json({ error: "Failed to complete task" }, 500);
    }

    const result = await response.json();

    // If task was just completed (not already completed), send confirmation
    if (result.success && !result.alreadyCompleted) {
      // Get task details to send confirmation
      const taskResponse = await fetch(
        `${CONVEX_HTTP_URL}/api/task-by-token?emailToken=${emailToken}`,
        {
          headers: {
            Authorization: `Bearer ${CONVEX_ADMIN_KEY}`,
          },
        },
      );

      if (taskResponse.ok) {
        const task = await taskResponse.json();

        // Send completion confirmation to task creator
        // Note: We would need to fetch creator email from user data
        // This is simplified - in production you'd query the user table
      }
    }

    return c.json({ success: true, completed: !result.alreadyCompleted });
  } catch (error) {
    console.error("Failed to process email webhook:", error);
    return c.json({ error: "Failed to process email" }, 500);
  }
});

// Endpoint to trigger scheduled reminders
app.post("/api/trigger-reminders", async (c) => {
  try {
    // This would be called by a scheduler (like cron)
    // Fetch pending tasks that need reminders from Convex
    const response = await fetch(`${CONVEX_HTTP_URL}/api/pending-reminders`, {
      headers: {
        Authorization: `Bearer ${CONVEX_ADMIN_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch pending reminders");
    }

    const tasks = await response.json();

    // Send reminder emails
    for (const task of tasks) {
      try {
        await sendReminderEmail({
          to: task.creatorEmail,
          taskTitle: task.title,
          taskDescription: task.description,
          assigneeName: task.assigneeName,
          assigneeEmail: task.assigneeEmail,
          createdAt: new Date(task.createdAt).toLocaleDateString(),
        });

        // Mark reminder as sent
        await fetch(`${CONVEX_HTTP_URL}/api/mark-reminder-sent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${CONVEX_ADMIN_KEY}`,
          },
          body: JSON.stringify({ taskId: task._id }),
        });
      } catch (error) {
        console.error(`Failed to send reminder for task ${task._id}:`, error);
      }
    }

    return c.json({ success: true, remindersSent: tasks.length });
  } catch (error) {
    console.error("Failed to trigger reminders:", error);
    return c.json({ error: "Failed to trigger reminders" }, 500);
  }
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

console.log(`Email service running at http://0.0.0.0:${port}`);

serve({
  fetch: app.fetch,
  port,
  hostname: "0.0.0.0",
});
