import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
} from "@react-email/components";

interface ReminderEmailProps {
  taskTitle: string;
  taskDescription?: string;
  assigneeName?: string;
  assigneeEmail: string;
  createdAt: string;
}

export function ReminderEmail({
  taskTitle,
  taskDescription,
  assigneeName,
  assigneeEmail,
  createdAt,
}: ReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reminder: Follow up on "{taskTitle}"</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>⏰ Task Reminder</Heading>

          <Text style={text}>Hi there,</Text>

          <Text style={text}>
            This is a friendly reminder to follow up on the task you assigned.
          </Text>

          <Section style={taskBox}>
            <Heading as="h2" style={h2}>
              {taskTitle}
            </Heading>
            {taskDescription && <Text style={taskDescriptionStyle}>{taskDescription}</Text>}
            <Text style={meta}>
              Assigned to: <strong>{assigneeName || assigneeEmail}</strong>
              <br />
              Assigned on: {createdAt}
            </Text>
          </Section>

          <Text style={text}>
            The assignee should reply to the assignment email with "complete" when finished.
          </Text>

          <Text style={text}>
            If you haven&apos;t received a completion confirmation, consider reaching out directly.
          </Text>

          <Text style={footer}>
            This reminder was sent via Delegate - Lightweight delegation for small business owners.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ReminderEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
  borderRadius: "8px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  marginBottom: "24px",
};

const h2 = {
  color: "#1a1a1a",
  fontSize: "20px",
  fontWeight: "600",
  marginBottom: "12px",
};

const text = {
  color: "#4a4a4a",
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "16px",
};

const taskBox = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "24px",
};

const taskDescriptionStyle = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 16px 0",
};

const meta = {
  color: "#94a3b8",
  fontSize: "12px",
  margin: "0",
};

const footer = {
  color: "#94a3b8",
  fontSize: "12px",
  marginTop: "32px",
  textAlign: "center" as const,
};
